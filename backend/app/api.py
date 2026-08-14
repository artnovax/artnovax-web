import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import List

import httpx
import stripe as stripe_sdk
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .config import (
    BACKEND_PUBLIC_URL,
    BRAND_LOGO_URL,
    FROM_EMAIL,
    MPESA_CALLBACK_URL,
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_ENV,
    MPESA_PASSKEY,
    MPESA_SHORTCODE,
    PUBLIC_ORIGIN,
    RESEND_API_KEY,
    STRIPE_SECRET_KEY,
    TEAM_EMAIL,
)
from .database import db
from .security import require_admin
from .utils import slugify

logger = logging.getLogger(__name__)
api_router = APIRouter(prefix="/api")
stripe_sdk.api_key = STRIPE_SECRET_KEY


async def migrate_legacy_content_assets():
    """Rewrite previously seeded agent-hosted image URLs to local public assets.

    The migration is intentionally narrow: it only matches the unique legacy
    artifact identifiers, so later admin-managed image URLs are left alone.
    It is safe to run on every startup and is a no-op for fresh databases.
    """
    migrations = [
        (
            db.events,
            {"title": "Mental Health Awareness 2026", "img": {"$regex": "06uj3u31_"}},
            "/assets/images/events/events-art-contest.webp",
        ),
        (
            db.founders,
            {"name": "Marion Yego", "img": {"$regex": "7xb549am_"}},
            "/assets/images/team/team-marion-yego.webp",
        ),
        (
            db.founders,
            {"name": "Ray Simbiri", "img": {"$regex": "2zauik0l_"}},
            "/assets/images/team/team-ray-simbiri.png",
        ),
        (
            db.founders,
            {"name": "Purity Mutua", "img": {"$regex": "5927wkz5_"}},
            "/assets/images/team/team-purity-mutua.jpeg",
        ),
        (
            db.founders,
            {"name": "Sherlyn Cheredi", "img": {"$regex": "smy8k0ka_"}},
            "/assets/images/team/team-sherlyn-cheredi.jpg",
        ),
        (
            db.founders,
            {"name": "Ivy Ndanu Maithya", "img": {"$regex": "dske4hw1_"}},
            "/assets/images/team/team-ivy-ndanu-maithya.webp",
        ),
    ]

    for collection, query, local_path in migrations:
        result = await collection.update_one(query, {"$set": {"img": local_path}})
        if result.modified_count:
            logger.info("Migrated legacy content image to %s", local_path)


# ---------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class NewsletterSubscribe(BaseModel):
    email: str
    source: str | None = None


class NewsletterEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    source: str | None = None
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "ArtNovaX API is up."}


@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(payload: NewsletterSubscribe):
    from fastapi import HTTPException

    email = (payload.email or "").strip().lower()
    if "@" not in email or "." not in email or len(email) < 5:
        raise HTTPException(
            status_code=400, detail="Please provide a valid email address."
        )
    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        return {
            "status": "already_subscribed",
            "message": "You're already on the list \u2014 thank you!",
        }
    entry = NewsletterEntry(email=email, source=payload.source)
    await db.newsletter_subscribers.insert_one(entry.model_dump())
    return {
        "status": "subscribed",
        "message": "Thanks \u2014 you're on the list!",
        "id": entry.id,
    }


@api_router.get("/newsletter/subscribers")
async def newsletter_list():
    docs = await db.newsletter_subscribers.find().sort("subscribed_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "subscribers": docs}


class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class ContactEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    subject: str
    message: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.post("/contact/submit")
async def contact_submit(payload: ContactMessage):
    from fastapi import HTTPException

    name = (payload.name or "").strip()
    email = (payload.email or "").strip().lower()
    subject = (payload.subject or "").strip()
    message = (payload.message or "").strip()
    if not name or not subject or len(message) < 5:
        raise HTTPException(
            status_code=400,
            detail="Please fill in your name, subject and a full message.",
        )
    if "@" not in email or "." not in email:
        raise HTTPException(
            status_code=400, detail="Please provide a valid email address."
        )
    entry = ContactEntry(name=name, email=email, subject=subject, message=message)
    await db.contact_messages.insert_one(entry.model_dump())
    return {
        "status": "sent",
        "message": "Thanks! We\u2019ll get back to you within 1\u20132 business days.",
        "id": entry.id,
    }


@api_router.get("/contact/messages")
async def contact_messages():
    docs = await db.contact_messages.find().sort("submitted_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "messages": docs}


# ---- Orders + Admin ----
class OrderCustomer(BaseModel):
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    payment: str | None = None


class OrderItem(BaseModel):
    name: str
    price: float
    qty: int


class OrderCreate(BaseModel):
    customer: OrderCustomer
    items: list[OrderItem]
    subtotal: float
    shipping: float = 0
    total: float


class OrderEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer: dict
    items: list
    subtotal: float
    shipping: float
    total: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.post("/orders/create")
async def orders_create(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")
    if not payload.customer.name or "@" not in (payload.customer.email or ""):
        raise HTTPException(
            status_code=400, detail="Please provide valid contact details."
        )
    entry = OrderEntry(
        customer=payload.customer.model_dump(),
        items=[i.model_dump() for i in payload.items],
        subtotal=payload.subtotal,
        shipping=payload.shipping,
        total=payload.total,
    )
    await db.orders.insert_one(entry.model_dump())
    # Fire-and-forget email confirmation (non-blocking)
    asyncio.create_task(_safe_send_email(entry.model_dump(), False))
    return {
        "status": "created",
        "id": entry.id,
        "message": "Order placed successfully.",
    }


# ---- Stripe Checkout Session (test-mode) ----
class StripeCheckoutIn(BaseModel):
    order_id: str
    success_url: str
    cancel_url: str


@api_router.post("/payments/stripe/checkout")
async def stripe_checkout(payload: StripeCheckoutIn):
    order = await db.orders.find_one({"id": payload.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if not stripe_sdk.api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured.")
    line_items = []
    for it in order.get("items", []):
        line_items.append(
            {
                "price_data": {
                    "currency": "kes",
                    "product_data": {"name": it.get("name", "Item")},
                    "unit_amount": int(round(float(it.get("price", 0)) * 100)),
                },
                "quantity": int(it.get("qty", 1)),
            }
        )
    if order.get("shipping", 0):
        line_items.append(
            {
                "price_data": {
                    "currency": "kes",
                    "product_data": {"name": "Shipping"},
                    "unit_amount": int(round(float(order["shipping"]) * 100)),
                },
                "quantity": 1,
            }
        )
    try:
        session = stripe_sdk.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            success_url=payload.success_url
            + f"?order_id={payload.order_id}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=payload.cancel_url + f"?order_id={payload.order_id}",
            customer_email=order.get("customer", {}).get("email"),
            metadata={"order_id": payload.order_id},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}") from e
    await db.orders.update_one(
        {"id": payload.order_id},
        {"$set": {"stripe_session_id": session.id, "payment_method": "card"}},
    )
    return {"url": session.url, "id": session.id}


@api_router.get("/payments/stripe/verify")
async def stripe_verify(order_id: str, session_id: str):
    try:
        session = stripe_sdk.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}") from e
    payment_status = session.get("payment_status")
    paid = payment_status == "paid"
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "payment_status": payment_status,
                "status": "paid" if paid else "pending",
            }
        },
    )
    if paid:
        order = await db.orders.find_one({"id": order_id})
        if order:
            order.pop("_id", None)
            # Send the confirmation email in the background so the caller isn\u2019t held up by Resend.
            asyncio.create_task(_safe_send_email(order, True))
    return {"paid": paid, "status": payment_status}


async def _safe_send_email(order: dict, paid: bool):
    try:
        await send_order_email(order, paid=paid)
    except Exception as _e:
        logger.warning(f"Background email failed: {_e}")


# ---------------------------------------------------------------
# Content managed via the admin dashboard: Events, Articles, Products
# ---------------------------------------------------------------
# ---- Events ----
class EventIn(BaseModel):
    title: str
    subtitle: str | None = None
    theme: str | None = None
    date: str | None = None  # e.g. "Wednesday, 4th March 2026"
    location: str | None = None
    audience: str | None = None
    tags: str | None = None  # comma-separated string, free text
    body: str | None = None
    img: str | None = None
    status: str = "upcoming"  # 'upcoming' | 'past'
    featured: bool = False
    partners: list[str] = Field(default_factory=list)
    poster: dict | None = None
    slug: str | None = None
    capacity: int | None = None  # max number of participants; None = unlimited
    reminder_hours: list[int] = Field(
        default_factory=lambda: [48]
    )  # list of hours-before-event to send reminders


class EventDoc(EventIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.get("/events")
async def events_list():
    await _seed_if_empty()
    docs = await db.events.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"events": docs}


@api_router.get("/events/{slug}")
async def events_get(slug: str):
    doc = await db.events.find_one({"slug": slug}) or await db.events.find_one(
        {"id": slug}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found.")
    doc.pop("_id", None)
    # attach live headcount so the detail page can show remaining spots / waitlist state
    counts = await _event_counts(doc["id"])
    cap = doc.get("capacity")
    doc["registered_count"] = counts["registered"]
    doc["waitlist_count"] = counts["waitlist"]
    doc["spots_left"] = max(int(cap) - counts["registered"], 0) if cap else None
    doc["is_full"] = bool(cap) and counts["registered"] >= int(cap)
    return doc


@api_router.post("/admin/events")
async def events_create(
    payload: EventIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump()
    d["slug"] = slugify(d.get("slug") or d.get("title") or "")
    if await db.events.find_one({"slug": d["slug"]}):
        d["slug"] = f"{d['slug']}-{str(uuid.uuid4())[:4]}"
    entry = EventDoc(**d)
    await db.events.insert_one(entry.model_dump())
    return entry.model_dump()


@api_router.put("/admin/events/{id}")
async def events_update(
    id: str, payload: EventIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump(exclude_unset=True)
    if "slug" in d and d["slug"]:
        d["slug"] = slugify(d["slug"])
    res = await db.events.update_one({"id": id}, {"$set": d})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found.")
    doc = await db.events.find_one({"id": id})
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/events/{id}")
async def events_delete(id: str, x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    res = await db.events.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found.")
    return {"deleted": True}


# ---- Articles ----
class ArticleIn(BaseModel):
    topic: str
    title: str
    excerpt: str | None = None
    read: str | None = "6 min read"
    updated: str | None = None
    hero: str | None = None
    lead: str | None = None
    blocks: list[dict] = Field(
        default_factory=list
    )  # [{type: 'h2'|'p'|'img'|'quote', text?, src?, alt?, caption?, author?}]
    takeaways: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    slug: str | None = None


class ArticleDoc(ArticleIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.get("/articles")
async def articles_list():
    await _seed_if_empty()
    docs = await db.articles.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"articles": docs}


@api_router.get("/articles/{slug}")
async def articles_get(slug: str):
    doc = await db.articles.find_one({"slug": slug})
    if not doc:
        doc = await db.articles.find_one({"id": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found.")
    doc.pop("_id", None)
    return doc


@api_router.post("/admin/articles")
async def articles_create(
    payload: ArticleIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump()
    d["slug"] = slugify(d.get("slug") or d.get("title") or "")
    if await db.articles.find_one({"slug": d["slug"]}):
        d["slug"] = f"{d['slug']}-{str(uuid.uuid4())[:4]}"
    entry = ArticleDoc(**d)
    await db.articles.insert_one(entry.model_dump())
    return entry.model_dump()


@api_router.put("/admin/articles/{id}")
async def articles_update(
    id: str, payload: ArticleIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump(exclude_unset=True)
    if "slug" in d and d["slug"]:
        d["slug"] = slugify(d["slug"])
    res = await db.articles.update_one({"id": id}, {"$set": d})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found.")
    doc = await db.articles.find_one({"id": id})
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/articles/{id}")
async def articles_delete(id: str, x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    res = await db.articles.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found.")
    return {"deleted": True}


# ---- Products ----
class ProductIn(BaseModel):
    name: str
    price: float
    currency: str = "KES"
    category: str = "All Products"
    img: str | None = None
    description: str | None = None
    active: bool = True


class ProductDoc(ProductIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.get("/products")
async def products_list():
    await _seed_if_empty()
    docs = await db.products.find({"active": True}).sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"products": docs}


@api_router.post("/admin/products")
async def products_create(
    payload: ProductIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    entry = ProductDoc(**payload.model_dump())
    await db.products.insert_one(entry.model_dump())
    return entry.model_dump()


@api_router.put("/admin/products/{id}")
async def products_update(
    id: str, payload: ProductIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump(exclude_unset=True)
    res = await db.products.update_one({"id": id}, {"$set": d})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")
    doc = await db.products.find_one({"id": id})
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/products/{id}")
async def products_delete(id: str, x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    res = await db.products.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")
    return {"deleted": True}


@api_router.get("/admin/products")
async def admin_products_list(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.products.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"products": docs}


@api_router.get("/admin/articles")
async def admin_articles_list(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.articles.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"articles": docs}


@api_router.get("/admin/events")
async def admin_events_list(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.events.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"events": docs}


# ---- Seed initial content if empty ----
_seeded = False


async def _seed_if_empty():
    global _seeded
    if _seeded:
        return
    if await db.events.count_documents({}) == 0:
        seed_events = [
            {
                "title": "Mental Health Awareness 2026",
                "subtitle": "Mindful of You: Campus of Care",
                "theme": "Mindful of You: Campus of Care",
                "date": "Wednesday, 4th March 2026",
                "location": "University of Nairobi",
                "audience": "Open to all students",
                "tags": "Creative Expression, Mindfulness, Community",
                "body": "Join us for a day of creative activities, conversations and resources focused on mental wellbeing and building a supportive campus community.",
                "img": "/assets/images/events/events-art-contest.webp",
                "status": "upcoming",
                "featured": True,
                "partners": ["ZURI HEALTH", "ArtNovaX", "NACADA"],
                "poster": {
                    "title": "Mental Health",
                    "subtitle": "AWARENESS 2026",
                    "colorFrom": "#6a1e3a",
                    "colorTo": "#c02565",
                },
            },
            {
                "title": "Doodling Together",
                "subtitle": "Creative expression session",
                "date": "Saturday, 17th May 2026",
                "location": "Nairobi, Kenya",
                "body": "A guided doodling and reflection session exploring emotions through art. All materials provided.",
                "img": "https://images.unsplash.com/photo-1560831340-b9679dc9e9f0",
                "status": "upcoming",
            },
            {
                "title": "Art & Mind Workshop",
                "subtitle": "Exploring art for wellbeing",
                "date": "Saturday, 21st June 2026",
                "location": "Nairobi, Kenya",
                "body": "A hands-on workshop using art to reduce stress and spark joy. Beginners welcome.",
                "img": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca",
                "status": "upcoming",
            },
            {
                "title": "Creative Circle \u2013 UoN",
                "subtitle": "Community art therapy",
                "date": "February 2026",
                "location": "University of Nairobi",
                "body": "A memorable evening of shared creative practice on the UoN campus.",
                "img": "https://images.unsplash.com/photo-1544928147-79a2dbc1f389",
                "status": "past",
            },
            {
                "title": "CD Art Therapy Session",
                "subtitle": "Painting on recycled CDs",
                "date": "January 2026",
                "location": "Kabete, Kenya",
                "body": "Participants transformed old CDs into vibrant reflections of joy and belonging.",
                "img": "https://images.unsplash.com/photo-1510832842230-87253f48d74f",
                "status": "past",
            },
            {
                "title": "Colours of Connection",
                "subtitle": "Group painting evening",
                "date": "December 2025",
                "location": "Nairobi, Kenya",
                "body": "A festive-season community painting evening focused on connection and gratitude.",
                "img": "https://images.pexels.com/photos/2559741/pexels-photo-2559741.jpeg",
                "status": "past",
            },
            {
                "title": "Mindful Art Sunday",
                "subtitle": "Slow, guided art",
                "date": "November 2025",
                "location": "Nairobi, Kenya",
                "body": "A slow Sunday of quiet, guided creativity to close the week gently.",
                "img": "https://images.unsplash.com/photo-1554996823-47d9c908bae7",
                "status": "past",
            },
        ]
        for e in seed_events:
            e["slug"] = slugify(e["title"])
            e_doc = EventDoc(**e)
            await db.events.insert_one(e_doc.model_dump())

    if await db.products.count_documents({}) == 0:
        seed_products = [
            {
                "name": "Sticker Pack",
                "price": 300,
                "category": "Stickers",
                "img": "https://images.unsplash.com/photo-1778278553405-09b847a2af3e",
                "description": "A joyful mix of ArtNovaX stickers.",
            },
            {
                "name": "Book Cards (Set of 5)",
                "price": 600,
                "category": "Book Cards",
                "img": "https://images.unsplash.com/photo-1680183718072-e9b55b649698",
                "description": "Beautifully illustrated cards for every mood.",
            },
            {
                "name": "ArtNovaX Hoodie",
                "price": 2500,
                "category": "Apparel",
                "img": "https://images.pexels.com/photos/18700207/pexels-photo-18700207.jpeg",
                "description": "Cozy burgundy hoodie with our subtle emblem.",
            },
            {
                "name": "Canvas Tote Bag",
                "price": 1200,
                "category": "Accessories",
                "img": "https://images.unsplash.com/photo-1544816155-12df9643f363",
                "description": "Durable canvas tote for creators on the go.",
            },
            {
                "name": "Enamel Pin",
                "price": 400,
                "category": "Accessories",
                "img": "https://images.unsplash.com/photo-1569513586164-80529357ad6f",
                "description": "A tiny brain-shaped nod to creative wellbeing.",
            },
            {
                "name": "Ceramic Mug",
                "price": 900,
                "category": "Accessories",
                "img": "https://images.unsplash.com/photo-1516390118834-21602d501886",
                "description": "Your morning tea deserves this.",
            },
        ]
        for p in seed_products:
            doc = ProductDoc(**p)
            await db.products.insert_one(doc.model_dump())

    _seeded = True


# ---------------------------------------------------------------
# Registrations, volunteer roles, partner inquiries and donations
# ---------------------------------------------------------------


class Question(BaseModel):
    id: str
    label: str
    type: str = "text"  # text | textarea | email | phone | select | radio | checkbox
    required: bool = False
    options: list[str] = Field(default_factory=list)
    help: str | None = None


class EventRegistration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    event_slug: str | None = None
    event_title: str | None = None
    name: str
    email: str
    phone: str | None = None
    answers: dict = Field(default_factory=dict)  # {question_id: value}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventRegistrationIn(BaseModel):
    event_id: str
    name: str
    email: str
    phone: str | None = None
    answers: dict = Field(default_factory=dict)


@api_router.post("/events/{event_id_or_slug}/register")
async def event_register(event_id_or_slug: str, payload: EventRegistrationIn):
    ev = await db.events.find_one({"id": event_id_or_slug}) or await db.events.find_one(
        {"slug": event_id_or_slug}
    )
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found.")
    if "@" not in (payload.email or "") or not payload.name.strip():
        raise HTTPException(
            status_code=400, detail="Please provide your name and a valid email."
        )
    cap = ev.get("capacity")
    confirmed_count = await db.event_registrations.count_documents(
        {"event_id": ev["id"], "status": {"$ne": "waitlist"}}
    )
    status = "waitlist" if (cap and confirmed_count >= int(cap)) else "confirmed"
    entry = {
        "id": str(uuid.uuid4()),
        "event_id": ev["id"],
        "event_slug": ev.get("slug"),
        "event_title": ev.get("title"),
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "phone": payload.phone,
        "answers": payload.answers or {},
        "status": status,
        "created_at": datetime.utcnow(),
    }
    await db.event_registrations.insert_one(entry)
    asyncio.create_task(_send_event_reg_email(entry, ev))
    msg = (
        "You\u2019re registered! We\u2019ve emailed a calendar invite."
        if status == "confirmed"
        else "The room is full \u2014 you\u2019re on the waitlist. We\u2019ll notify you if a spot opens."
    )
    return {
        "status": status,
        "id": entry["id"],
        "ical_url": f"/api/registrations/{entry['id']}/ical",
        "message": msg,
    }


async def _event_counts(event_id: str) -> dict:
    confirmed = await db.event_registrations.count_documents(
        {"event_id": event_id, "status": {"$ne": "waitlist"}}
    )
    waitlist = await db.event_registrations.count_documents(
        {"event_id": event_id, "status": "waitlist"}
    )
    return {"registered": confirmed, "waitlist": waitlist}


@api_router.get("/registrations/{reg_id}/ical")
async def registration_ical(reg_id: str):
    from fastapi.responses import Response

    reg = await db.event_registrations.find_one({"id": reg_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found.")
    ev = await db.events.find_one({"id": reg["event_id"]})
    ics = _build_ics(ev or {}, reg)
    return Response(
        content=ics,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="artnovax-{reg["event_slug"] or reg_id}.ics"'
        },
    )


def _build_ics(ev: dict, reg: dict) -> str:
    from datetime import timedelta

    dt = _event_datetime(ev)
    start = dt.strftime("%Y%m%dT%H%M%SZ")
    end = (dt + timedelta(hours=3)).strftime("%Y%m%dT%H%M%SZ")
    uid = f"{reg['id']}@artnovax"
    esc = (
        lambda s: (s or "").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")
    )
    return (
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ArtNovaX//EN\r\nMETHOD:PUBLISH\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{uid}\r\nDTSTAMP:{start}\r\nDTSTART:{start}\r\nDTEND:{end}\r\n"
        f"SUMMARY:{esc(ev.get('title', 'ArtNovaX Event'))}\r\n"
        f"DESCRIPTION:{esc((ev.get('body') or '') + '  Registered by ' + (reg.get('name') or ''))}\r\n"
        f"LOCATION:{esc(ev.get('location', ''))}\r\n"
        "END:VEVENT\r\nEND:VCALENDAR\r\n"
    )


async def _send_event_reg_email(reg: dict, ev: dict):
    if not RESEND_API_KEY:
        return
    to = reg.get("email")
    if not to:
        return
    logo_url = BRAND_LOGO_URL
    is_waitlist = reg.get("status") == "waitlist"
    origin = PUBLIC_ORIGIN
    backend_url = BACKEND_PUBLIC_URL
    ical_link = f"{backend_url.rstrip('/')}/api/registrations/{reg['id']}/ical"
    gcal_link = _google_calendar_link(ev)

    if is_waitlist:
        heading = "You\u2019re on the waitlist \u2014 we\u2019ll be in touch."
        intro = (
            f"Hi {reg.get('name','friend')}, thanks for signing up for "
            f"<b>{ev.get('title','our event')}</b>. The room is full for now, so we\u2019ve saved your "
            "place on the waitlist. If a spot opens up we\u2019ll email you straight away."
        )
        cta = ""  # no calendar link yet \u2014 they don\u2019t have a confirmed seat
        subject = f"Waitlist confirmed: {ev.get('title','the event')}"
        team_subject = f"[Waitlist] {ev.get('title','event')}"
    else:
        heading = "You\u2019re registered \u2014 see you there."
        intro = f"Hi {reg.get('name','friend')}, thanks for signing up for <b>{ev.get('title','our event')}</b>."
        cta = (
            '<p style="margin:16px 0">'
            f'<a style="background:#5C1519;color:#FBF3E8;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;margin-right:6px" href="{gcal_link}">Add to Google Calendar</a>'
            f'<a style="background:#FBF3E8;color:#5C1519;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;border:2px solid #5C1519" href="{ical_link}">Apple / Outlook (.ics)</a>'
            "</p>"
        )
        subject = f"You\u2019re registered for {ev.get('title','the event')}"
        team_subject = f"[New registration] {ev.get('title','event')}"

    html = f"""
    <div style=\"background:#FBF3E8;padding:32px;font-family:Inter,Arial,sans-serif;color:#2A1B1C\">
      <div style=\"max-width:560px;margin:auto;background:#FDF7EE;border:1px solid #F1DFC7;border-radius:16px;padding:24px\">
        <div style=\"text-align:center;margin-bottom:16px\"><img src=\"{logo_url}\" alt=\"ArtNovaX\" style=\"height:56px\" /></div>
        <h1 style=\"font-family:'Fraunces',Georgia,serif;color:#5C1519;font-size:24px;margin:0 0 6px\">{heading}</h1>
        <p style=\"margin:0 0 12px;color:#2A1B1CBF\">{intro}</p>
        <p style=\"margin:0 0 12px;color:#2A1B1CBF\"><b>When:</b> {ev.get('date','TBA')}<br/><b>Where:</b> {ev.get('location','TBA')}</p>
        {cta}
        <p style=\"margin-top:22px;font-family:'Fraunces',Georgia,serif;font-style:italic;color:#5C1519\">where art heals, tech empowers, & minds transform.</p>
      </div>
    </div>
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html},
            )
            if TEAM_EMAIL:
                await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": FROM_EMAIL,
                        "to": [TEAM_EMAIL],
                        "subject": team_subject,
                        "html": html,
                    },
                )
    except Exception as e:
        logger.warning(f"Registration email failed: {e}")


def _event_datetime(ev: dict):
    from datetime import timedelta

    dt = datetime.utcnow() + timedelta(days=14)
    try:
        import dateutil.parser as dp  # type: ignore

        if ev.get("date"):
            dt = dp.parse(ev["date"], fuzzy=True)
    except Exception:
        pass
    return dt


def _google_calendar_link(ev: dict) -> str:
    from urllib.parse import urlencode
    from datetime import timedelta

    dt = _event_datetime(ev)
    start = dt.strftime("%Y%m%dT%H%M%SZ")
    end = (dt + timedelta(hours=3)).strftime("%Y%m%dT%H%M%SZ")
    q = {
        "action": "TEMPLATE",
        "text": ev.get("title", "ArtNovaX Event"),
        "dates": f"{start}/{end}",
        "location": ev.get("location", ""),
        "details": (ev.get("body") or "") + "\n\nRegistered via ArtNovaX",
    }
    return "https://calendar.google.com/calendar/render?" + urlencode(q)


@api_router.get("/admin/registrations")
async def admin_registrations(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.event_registrations.find().sort("created_at", -1).to_list(2000)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "registrations": docs}


# ---- Volunteer Roles + Applications ----
class VolunteerRoleIn(BaseModel):
    title: str
    department: str | None = None
    commitment: str | None = None
    location: str | None = None
    description: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    questions: list[dict] = Field(default_factory=list)
    active: bool = True
    slug: str | None = None


class VolunteerRoleDoc(VolunteerRoleIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.get("/volunteer/roles")
async def volunteer_roles_list():
    await _seed_volunteer_if_empty()
    docs = (
        await db.volunteer_roles.find({"active": True})
        .sort("created_at", -1)
        .to_list(200)
    )
    for d in docs:
        d.pop("_id", None)
    return {"roles": docs}


@api_router.get("/volunteer/roles/{slug}")
async def volunteer_role_get(slug: str):
    doc = await db.volunteer_roles.find_one(
        {"slug": slug}
    ) or await db.volunteer_roles.find_one({"id": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Role not found.")
    doc.pop("_id", None)
    return doc


@api_router.post("/admin/volunteer/roles")
async def volunteer_role_create(
    payload: VolunteerRoleIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump()
    d["slug"] = slugify(d.get("slug") or d.get("title") or "")
    if await db.volunteer_roles.find_one({"slug": d["slug"]}):
        d["slug"] = f"{d['slug']}-{str(uuid.uuid4())[:4]}"
    doc = VolunteerRoleDoc(**d)
    await db.volunteer_roles.insert_one(doc.model_dump())
    return doc.model_dump()


@api_router.put("/admin/volunteer/roles/{id}")
async def volunteer_role_update(
    id: str, payload: VolunteerRoleIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump(exclude_unset=True)
    if "slug" in d and d["slug"]:
        d["slug"] = slugify(d["slug"])
    res = await db.volunteer_roles.update_one({"id": id}, {"$set": d})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Role not found.")
    doc = await db.volunteer_roles.find_one({"id": id})
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/volunteer/roles/{id}")
async def volunteer_role_delete(
    id: str, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    res = await db.volunteer_roles.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found.")
    return {"deleted": True}


@api_router.get("/admin/volunteer/roles")
async def admin_volunteer_roles_all(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.volunteer_roles.find().sort("created_at", -1).to_list(500)
    for d in docs:
        d.pop("_id", None)
    return {"roles": docs}


class VolunteerAppIn(BaseModel):
    role_id: str
    name: str
    email: str
    phone: str | None = None
    answers: dict = Field(default_factory=dict)


@api_router.post("/volunteer/apply")
async def volunteer_apply(payload: VolunteerAppIn):
    role = await db.volunteer_roles.find_one(
        {"id": payload.role_id}
    ) or await db.volunteer_roles.find_one({"slug": payload.role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    if "@" not in payload.email or not payload.name.strip():
        raise HTTPException(
            status_code=400, detail="Please provide your name and a valid email."
        )
    entry = {
        "id": str(uuid.uuid4()),
        "role_id": role["id"],
        "role_title": role.get("title"),
        "role_slug": role.get("slug"),
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "phone": payload.phone,
        "answers": payload.answers or {},
        "status": "new",
        "created_at": datetime.utcnow(),
    }
    await db.volunteer_applications.insert_one(entry)
    asyncio.create_task(
        _notify_team(
            "New volunteer application",
            f"{entry['name']} applied for {entry['role_title']}",
        )
    )
    return {
        "status": "submitted",
        "id": entry["id"],
        "message": "Application received. We\u2019ll be in touch soon.",
    }


@api_router.get("/admin/volunteer/applications")
async def volunteer_apps_list(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.volunteer_applications.find().sort("created_at", -1).to_list(2000)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "applications": docs}


# ---- Partner Inquiries ----
class PartnerIn(BaseModel):
    org_name: str
    contact_name: str
    role: str | None = None
    email: str
    phone: str | None = None
    website: str | None = None
    org_type: str | None = None
    partnership_type: str | None = None
    goals: str | None = None
    audience: str | None = None
    budget: str | None = None
    timeline: str | None = None
    message: str | None = None


@api_router.post("/partner/inquire")
async def partner_inquire(payload: PartnerIn):
    if "@" not in payload.email or not payload.org_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide organisation name and a valid email.",
        )
    entry = payload.model_dump()
    entry.update(
        {"id": str(uuid.uuid4()), "created_at": datetime.utcnow(), "status": "new"}
    )
    await db.partner_inquiries.insert_one(entry)
    asyncio.create_task(
        _notify_team(
            "New partnership inquiry",
            f"{payload.org_name} \u2014 {payload.contact_name}\n{payload.email}",
        )
    )
    return {
        "status": "submitted",
        "id": entry["id"],
        "message": "Thank you. Our Partnerships Lead will be in touch soon.",
    }


@api_router.get("/admin/partner/inquiries")
async def partner_inquiries_list(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.partner_inquiries.find().sort("created_at", -1).to_list(2000)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "inquiries": docs}


# ---- Donations via Stripe ----
class DonationIn(BaseModel):
    amount_kes: int
    name: str | None = None
    email: str | None = None
    message: str | None = None


@api_router.post("/donations/checkout")
async def donation_checkout(payload: DonationIn):
    if payload.amount_kes < 100:
        raise HTTPException(status_code=400, detail="Minimum donation is KES 100.")
    if not stripe_sdk.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured.")
    entry = {
        "id": str(uuid.uuid4()),
        "amount_kes": payload.amount_kes,
        "name": payload.name,
        "email": payload.email,
        "message": payload.message,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    await db.donations.insert_one(entry)
    origin = PUBLIC_ORIGIN
    try:
        session = stripe_sdk.checkout.Session.create(
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "kes",
                        "product_data": {"name": "ArtNovaX Donation"},
                        "unit_amount": int(payload.amount_kes) * 100,
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{origin}/support/thanks?donation_id={entry['id']}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/support",
            customer_email=payload.email,
            metadata={"donation_id": entry["id"]},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}") from e
    await db.donations.update_one(
        {"id": entry["id"]}, {"$set": {"stripe_session_id": session.id}}
    )
    return {"url": session.url, "id": session.id, "donation_id": entry["id"]}


@api_router.get("/donations/verify")
async def donation_verify(donation_id: str, session_id: str):
    try:
        session = stripe_sdk.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}") from e
    payment_status = session.get("payment_status")
    paid = payment_status == "paid"
    await db.donations.update_one(
        {"id": donation_id}, {"$set": {"status": "paid" if paid else payment_status}}
    )
    return {"paid": paid, "status": payment_status}


@api_router.get("/admin/donations")
async def admin_donations(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.donations.find().sort("created_at", -1).to_list(2000)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "donations": docs}


async def _notify_team(subject: str, body: str):
    if not RESEND_API_KEY or not TEAM_EMAIL:
        return
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [TEAM_EMAIL],
                    "subject": subject,
                    "html": f"<pre style='font-family:Inter,Arial,sans-serif;font-size:14px;color:#2A1B1C'>{body}</pre>",
                },
            )
    except Exception as e:
        logger.warning(f"Team notify failed: {e}")


async def _seed_volunteer_if_empty():
    if await db.volunteer_roles.count_documents({}) > 0:
        return
    default_q = [
        {
            "id": "why",
            "label": "Why do you want to volunteer with ArtNovaX?",
            "type": "textarea",
            "required": True,
        },
        {
            "id": "skills",
            "label": "What skills or experience do you bring?",
            "type": "textarea",
            "required": True,
        },
        {
            "id": "availability",
            "label": "What is your weekly availability?",
            "type": "text",
            "required": True,
        },
        {
            "id": "linkedin",
            "label": "LinkedIn / portfolio URL (optional)",
            "type": "text",
        },
    ]
    seed = [
        {
            "title": "Community Facilitator",
            "department": "Programs",
            "commitment": "~6 hrs/week",
            "location": "Nairobi (in-person)",
            "description": "Help facilitate creative wellbeing sessions at partner campuses and community spaces.",
            "responsibilities": [
                "Co-facilitate 1\u20132 sessions/month",
                "Prepare materials",
                "Help welcome participants",
            ],
            "requirements": [
                "Warm, patient presence",
                "Interest in mental wellbeing",
                "Comfortable speaking in groups",
            ],
            "questions": default_q,
        },
        {
            "title": "Content & Storytelling",
            "department": "Communications",
            "commitment": "~4 hrs/week",
            "location": "Remote",
            "description": "Craft short-form posts, session recaps and insight summaries in a warm, plain voice.",
            "responsibilities": [
                "Draft 2\u20134 posts/month",
                "Interview participants (with consent)",
                "Support newsletter",
            ],
            "requirements": [
                "Excellent written English",
                "Sensitivity around mental health topics",
                "Portfolio helpful",
            ],
            "questions": default_q,
        },
        {
            "title": "Research Assistant",
            "department": "Research",
            "commitment": "~5 hrs/week",
            "location": "Remote",
            "description": "Support literature reviews and translate research into accessible insights.",
            "responsibilities": [
                "Summarise 1\u20132 papers/month",
                "Help with references",
                "Contribute to Insights articles",
            ],
            "requirements": [
                "Undergrad-level research skills",
                "Curiosity and rigour",
                "Kenyan context helpful",
            ],
            "questions": default_q,
        },
    ]
    for r in seed:
        r["slug"] = slugify(r["title"])
        r["active"] = True
        doc = VolunteerRoleDoc(**r)
        await db.volunteer_roles.insert_one(doc.model_dump())


# ---------------------------------------------------------------
# Founders
# ---------------------------------------------------------------
class FounderIn(BaseModel):
    name: str
    role: str | None = None
    short: str | None = None
    bio: str | None = None
    img: str | None = None
    linkedin: str | None = None
    funfact: str | None = None
    medium: str | None = None
    why_art: str | None = None
    order: int = 0
    slug: str | None = None


class FounderDoc(FounderIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)


@api_router.get("/founders")
async def founders_list():
    await _seed_founders_if_empty()
    docs = await db.founders.find().sort("order", 1).to_list(200)
    for d in docs:
        d.pop("_id", None)
    return {"founders": docs}


@api_router.get("/founders/{slug}")
async def founder_get(slug: str):
    doc = await db.founders.find_one({"slug": slug}) or await db.founders.find_one(
        {"id": slug}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Founder not found.")
    doc.pop("_id", None)
    return doc


@api_router.post("/admin/founders")
async def founder_create(
    payload: FounderIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump()
    d["slug"] = slugify(d.get("slug") or d.get("name") or "")
    if await db.founders.find_one({"slug": d["slug"]}):
        d["slug"] = f"{d['slug']}-{str(uuid.uuid4())[:4]}"
    doc = FounderDoc(**d)
    await db.founders.insert_one(doc.model_dump())
    return doc.model_dump()


@api_router.put("/admin/founders/{id}")
async def founder_update(
    id: str, payload: FounderIn, x_admin_token: str | None = Header(default=None)
):
    require_admin(x_admin_token)
    d = payload.model_dump(exclude_unset=True)
    if "slug" in d and d["slug"]:
        d["slug"] = slugify(d["slug"])
    res = await db.founders.update_one({"id": id}, {"$set": d})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Founder not found.")
    doc = await db.founders.find_one({"id": id})
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/founders/{id}")
async def founder_delete(id: str, x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    res = await db.founders.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Founder not found.")
    return {"deleted": True}


@api_router.get("/admin/founders")
async def admin_founders_list(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.founders.find().sort("order", 1).to_list(200)
    for d in docs:
        d.pop("_id", None)
    return {"founders": docs}


async def _seed_founders_if_empty():
    if await db.founders.count_documents({}) > 0:
        return
    seed = [
        {
            "name": "Marion Yego",
            "role": "Founder & Executive Director",
            "short": "Veterinarian and creative who founded ArtNovaX to make art a genuine route to mental wellness.",
            "bio": "Marion founded ArtNovaX in 2023 out of a deeply personal place \u2014 art had been her way through her own mental-health struggles, and she wanted others to have that door too. As a veterinarian she brings scientific rigour to our research work; as a creative she keeps our programs open, curious and human.",
            "img": "/assets/images/team/team-marion-yego.webp",
            "linkedin": None,
            "funfact": "Would happily live on potatoes in every form \u2014 from viazi karai to mashed.",
            "medium": "Pencil art",
            "why_art": "Every human is intrinsically artistic; used well, art is a real form of healing.",
            "order": 1,
        },
        {
            "name": "Ray Simbiri",
            "role": "Chief Technology Officer",
            "short": "CS student at UChicago building ArtNovaX\u2019s calm, distraction-conscious platform.",
            "bio": "Ray joined ArtNovaX in August 2025, curious about what becomes possible when the healing side of creativity meets thoughtful technology.",
            "img": "/assets/images/team/team-ray-simbiri.png",
            "linkedin": "https://www.linkedin.com/in/simbiriisaacray/",
            "funfact": "Firmly (and passionately) believes Messi is overrated.",
            "medium": "Poetry \u2014 and sometimes a guitar",
            "why_art": "Poetry helps him understand a feeling long before he can describe it.",
            "order": 2,
        },
        {
            "name": "Purity Mutua",
            "role": "Partnerships Lead",
            "short": "Veterinary surgeon and artist mobilising partners for youth mental health.",
            "bio": "Purity joined ArtNovaX after seeing first-hand the impact of our art-therapy sessions with young people.",
            "img": "/assets/images/team/team-purity-mutua.jpeg",
            "linkedin": "https://www.linkedin.com/in/purity-mutua/",
            "funfact": "Loves coffee, Pingu and M\u00f8rda\u2019s BLE55ING5.",
            "medium": "Ink and paper",
            "why_art": "Creating gives you somewhere to put your mind while it settles.",
            "order": 3,
        },
        {
            "name": "Sherlyn Cheredi",
            "role": "Research Lead",
            "short": "Financial analyst helping ArtNovaX measure what really moves youth wellbeing.",
            "bio": "Sherlyn joined ArtNovaX in May 2025 to help translate impact into evidence.",
            "img": "/assets/images/team/team-sherlyn-cheredi.jpg",
            "linkedin": None,
            "funfact": "Rewatches her comfort show for the 100th time.",
            "medium": "Adult colouring books",
            "why_art": "When words fail, creating still says enough.",
            "order": 4,
        },
        {
            "name": "Ivy Ndanu Maithya",
            "role": "Lead Psychologist",
            "short": "CPB-registered counselling psychologist grounding our work in safety and evidence.",
            "bio": "Ivy joined ArtNovaX in 2026 to make mental health support accessible, creative and non-intimidating for young Kenyans.",
            "img": "/assets/images/team/team-ivy-ndanu-maithya.webp",
            "linkedin": None,
            "funfact": "Has a playlist for every mood \u2014 sings anywhere like it\u2019s a full concert.",
            "medium": "Plasticine",
            "why_art": "Art bypasses stigma \u2014 many won\u2019t say \u201cI\u2019m anxious\u201d but they\u2019ll paint it.",
            "order": 5,
        },
    ]
    for f in seed:
        f["slug"] = slugify(f["name"])
        doc = FounderDoc(**f)
        await db.founders.insert_one(doc.model_dump())


# ---------------------------------------------------------------
# Reminder scheduler
# Auto-run is disabled: the admin triggers reminders manually from the
# dashboard (POST /api/admin/events/{id}/send-reminders). Keeping the loop
# here so the automatic path can be re-enabled by flipping a single flag.
# ---------------------------------------------------------------
async def _reminder_loop():
    from datetime import timedelta

    while True:
        try:
            now = datetime.utcnow()
            regs = await db.event_registrations.find(
                {"reminder_sent": {"$ne": True}}
            ).to_list(500)
            for reg in regs:
                ev = (
                    await db.events.find_one({"id": reg.get("event_id")})
                    if reg.get("event_id")
                    else None
                )
                if not ev:
                    continue
                event_dt = _event_datetime(ev)
                delta = event_dt - now
                if timedelta(hours=36) <= delta <= timedelta(hours=48):
                    try:
                        await _send_reminder_email(reg, ev)
                        await db.event_registrations.update_one(
                            {"id": reg["id"]},
                            {"$set": {"reminder_sent": True, "reminder_sent_at": now}},
                        )
                    except Exception as ex:
                        logger.warning(f"Reminder send failed: {ex}")
        except Exception as e:
            logger.warning(f"Reminder loop error: {e}")
        await asyncio.sleep(3600)  # every hour


async def _send_reminder_email(reg: dict, ev: dict):
    if not RESEND_API_KEY:
        return
    to = reg.get("email")
    if not to:
        return
    origin = PUBLIC_ORIGIN
    backend_url = BACKEND_PUBLIC_URL
    ical_link = f"{backend_url.rstrip('/')}/api/registrations/{reg['id']}/ical"
    gcal_link = _google_calendar_link(ev)
    logo_url = BRAND_LOGO_URL
    html = f"""
    <div style=\"background:#FBF3E8;padding:32px;font-family:Inter,Arial,sans-serif;color:#2A1B1C\">
      <div style=\"max-width:560px;margin:auto;background:#FDF7EE;border:1px solid #F1DFC7;border-radius:16px;padding:24px\">
        <div style=\"text-align:center;margin-bottom:16px\"><img src=\"{logo_url}\" alt=\"ArtNovaX\" style=\"height:56px\" /></div>
        <h1 style=\"font-family:'Fraunces',Georgia,serif;color:#5C1519;font-size:24px;margin:0 0 6px\">A gentle reminder \u2014 see you in two days.</h1>
        <p style=\"margin:0 0 12px;color:#2A1B1CBF\">Hi {reg.get('name','friend')}, we\u2019re looking forward to hosting you at <b>{ev.get('title','our event')}</b>.</p>
        <p style=\"margin:0 0 12px;color:#2A1B1CBF\"><b>When:</b> {ev.get('date','TBA')}<br/><b>Where:</b> {ev.get('location','TBA')}</p>
        <p style=\"margin:16px 0\">
          <a style=\"background:#5C1519;color:#FBF3E8;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;margin-right:6px\" href=\"{gcal_link}\">Open in Google Calendar</a>
          <a style=\"background:#FBF3E8;color:#5C1519;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;border:2px solid #5C1519\" href=\"{ical_link}\">Apple / Outlook (.ics)</a>
        </p>
        <p style=\"margin-top:22px;font-family:'Fraunces',Georgia,serif;font-style:italic;color:#5C1519\">where art heals, tech empowers, & minds transform.</p>
      </div>
    </div>
    """
    async with httpx.AsyncClient(timeout=15) as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to],
                "subject": f"Reminder: {ev.get('title','your event')} is in 2 days",
                "html": html,
            },
        )


@api_router.post("/admin/events/{event_id}/send-reminders")
async def admin_send_reminders(
    event_id: str, x_admin_token: str | None = Header(default=None)
):
    """Trigger a reminder email to every confirmed attendee of a given event."""
    require_admin(x_admin_token)
    ev = await db.events.find_one({"id": event_id}) or await db.events.find_one(
        {"slug": event_id}
    )
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found.")
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service is not configured.")
    regs = await db.event_registrations.find(
        {
            "event_id": ev["id"],
            "status": {"$ne": "waitlist"},
        }
    ).to_list(2000)
    sent, failed = 0, 0
    for reg in regs:
        try:
            await _send_reminder_email(reg, ev)
            await db.event_registrations.update_one(
                {"id": reg["id"]},
                {
                    "$set": {
                        "reminder_sent": True,
                        "reminder_sent_at": datetime.utcnow(),
                    }
                },
            )
            sent += 1
        except Exception as ex:
            failed += 1
            logger.warning(f"Manual reminder failed for {reg.get('email')}: {ex}")
    return {"sent": sent, "failed": failed, "attendees": len(regs)}


# ---- M-Pesa STK Push (Safaricom Daraja) ----
# When Daraja keys are present in .env we hit the real sandbox / production endpoint.
# Otherwise we fall back to a stub so local dev doesn\u2019t break.
_DARAJA_BASE = (
    "https://sandbox.safaricom.co.ke"
    if MPESA_ENV != "production"
    else "https://api.safaricom.co.ke"
)


def _mpesa_ready() -> bool:
    return bool(MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET and MPESA_PASSKEY)


async def _mpesa_access_token() -> str:
    from base64 import b64encode

    creds = b64encode(f"{MPESA_CONSUMER_KEY}:{MPESA_CONSUMER_SECRET}".encode()).decode()
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{_DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {creds}"},
        )
        r.raise_for_status()
        return r.json()["access_token"]


def _mpesa_normalize_msisdn(raw: str) -> str:
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    if digits.startswith("254"):
        return digits
    if digits.startswith("0"):
        return "254" + digits[1:]
    if digits.startswith("7") or digits.startswith("1"):
        return "254" + digits
    return digits


class MpesaSTKIn(BaseModel):
    order_id: str
    phone: str  # accepted formats: 07XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX


@api_router.post("/payments/mpesa/stk")
async def mpesa_stk(payload: MpesaSTKIn):
    order = await db.orders.find_one({"id": payload.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    phone = _mpesa_normalize_msisdn(payload.phone)
    if len(phone) < 12:
        raise HTTPException(
            status_code=400, detail="Please provide a valid phone number."
        )

    amount = int(round(float(order.get("total", 0))))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Nothing to pay.")

    # Simulator path \u2014 keeps local dev working without Daraja credentials.
    if not _mpesa_ready():
        ref = str(uuid.uuid4())[:12].upper()
        await db.orders.update_one(
            {"id": payload.order_id},
            {
                "$set": {
                    "mpesa_phone": phone,
                    "mpesa_ref": ref,
                    "payment_method": "mpesa",
                    "payment_status": "pending",
                }
            },
        )
        return {
            "status": "sent",
            "message": f"[Sandbox stub] STK push sent to {phone}. Enter your PIN to complete.",
            "ref": ref,
            "simulator": True,
        }

    # Real Daraja STK Push
    from base64 import b64encode

    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    password = b64encode(f"{MPESA_SHORTCODE}{MPESA_PASSKEY}{ts}".encode()).decode()
    try:
        token = await _mpesa_access_token()
        body = {
            "BusinessShortCode": MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": ts,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": MPESA_SHORTCODE,
            "PhoneNumber": phone,
            "CallBackURL": MPESA_CALLBACK_URL or "https://example.com/mpesa/callback",
            "AccountReference": f"ArtNovaX-{payload.order_id[:8].upper()}",
            "TransactionDesc": "ArtNovaX order",
        }
        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.post(
                f"{_DARAJA_BASE}/mpesa/stkpush/v1/processrequest",
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"M-Pesa error: {e}")

    if str(data.get("ResponseCode", "")) != "0":
        raise HTTPException(
            status_code=502,
            detail=data.get("errorMessage")
            or data.get("ResponseDescription")
            or "M-Pesa request rejected.",
        )

    checkout_id = data.get("CheckoutRequestID")
    merchant_id = data.get("MerchantRequestID")
    await db.orders.update_one(
        {"id": payload.order_id},
        {
            "$set": {
                "mpesa_phone": phone,
                "mpesa_ref": checkout_id,
                "mpesa_merchant_id": merchant_id,
                "payment_method": "mpesa",
                "payment_status": "pending",
            }
        },
    )
    return {
        "status": "sent",
        "message": f"STK push sent to {phone}. Enter your M-Pesa PIN to complete.",
        "ref": checkout_id,
        "simulator": False,
    }


class MpesaConfirmIn(BaseModel):
    order_id: str
    ref: str
    pin: str


@api_router.post("/payments/mpesa/confirm")
async def mpesa_confirm(payload: MpesaConfirmIn):
    """Client-side confirmation used only in stub mode. Real M-Pesa transactions
    are confirmed asynchronously by Daraja calling MPESA_CALLBACK_URL."""
    order = await db.orders.find_one({"id": payload.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.get("mpesa_ref") != payload.ref:
        raise HTTPException(status_code=400, detail="Reference mismatch.")
    if len(payload.pin) < 4:
        raise HTTPException(status_code=400, detail="M-Pesa PIN must be 4 digits.")
    receipt = "TEST" + str(uuid.uuid4())[:8].upper()
    await db.orders.update_one(
        {"id": payload.order_id},
        {
            "$set": {
                "payment_status": "paid",
                "status": "paid",
                "mpesa_receipt": receipt,
            }
        },
    )
    order = await db.orders.find_one({"id": payload.order_id})
    if order:
        order.pop("_id", None)
        asyncio.create_task(_safe_send_email(order, True))
    return {
        "paid": True,
        "receipt": receipt,
        "message": "Payment received. Karibu tena!",
    }


@api_router.post("/payments/mpesa/callback")
async def mpesa_callback(payload: dict):
    """Daraja C2B/STK callback endpoint. Marks the corresponding order as paid."""
    try:
        body = payload.get("Body", {}).get("stkCallback", {})
        checkout_id = body.get("CheckoutRequestID")
        result_code = body.get("ResultCode")
        if not checkout_id:
            return {"ok": True}
        if result_code == 0:
            items = {
                i.get("Name"): i.get("Value")
                for i in body.get("CallbackMetadata", {}).get("Item", [])
            }
            receipt = items.get("MpesaReceiptNumber", "")
            await db.orders.update_one(
                {"mpesa_ref": checkout_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "paid",
                        "mpesa_receipt": receipt,
                    }
                },
            )
            order = await db.orders.find_one({"mpesa_ref": checkout_id})
            if order:
                order.pop("_id", None)
                asyncio.create_task(_safe_send_email(order, True))
        else:
            await db.orders.update_one(
                {"mpesa_ref": checkout_id},
                {
                    "$set": {
                        "payment_status": "failed",
                        "mpesa_result": body.get("ResultDesc"),
                    }
                },
            )
    except Exception as e:
        logger.warning(f"M-Pesa callback parse error: {e}")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@api_router.get("/payments/mpesa/status")
async def mpesa_status(order_id: str):
    """Lightweight polling endpoint used by the Checkout page while the user
    completes the STK prompt on their phone."""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return {
        "status": order.get("payment_status", "pending"),
        "receipt": order.get("mpesa_receipt"),
    }


# ---- Resend email helper ----
def _order_html(order: dict, paid: bool) -> str:
    items = order.get("items", [])
    rows = "".join(
        f'<tr><td style="padding:6px 0;color:#2A1B1C">{it.get("name")} \u00d7 {int(it.get("qty",1))}</td>'
        f'<td style="padding:6px 0;text-align:right;color:#5C1519;font-weight:600">KES {int(float(it.get("price",0)) * int(it.get("qty",1))):,}</td></tr>'
        for it in items
    )
    status_txt = (
        "Payment received \u2014 thank you!"
        if paid
        else "Order received \u2014 we\u2019ll be in touch."
    )
    logo_url = BRAND_LOGO_URL
    return f"""
    <div style=\"background:#FBF3E8;padding:32px;font-family:Inter,Arial,sans-serif;color:#2A1B1C\">
      <div style=\"max-width:560px;margin:auto;background:#FDF7EE;border:1px solid #F1DFC7;border-radius:16px;padding:24px\">
        <div style=\"text-align:center;margin-bottom:16px\"><img src=\"{logo_url}\" alt=\"ArtNovaX\" style=\"height:56px\" /></div>
        <h1 style=\"font-family:'Fraunces',Georgia,serif;color:#5C1519;font-size:26px;margin:0 0 6px\">{status_txt}</h1>
        <p style=\"margin:0 0 16px;color:#2A1B1CBF\">Hi {order.get('customer',{}).get('name','friend')}, thank you for supporting ArtNovaX.</p>
        <div style=\"font-size:12px;color:#5C1519;letter-spacing:.14em;font-weight:600\">ORDER #{order.get('id','')[:8].upper()}</div>
        <table style=\"width:100%;margin-top:8px;border-collapse:collapse;font-size:14px\">{rows}</table>
        <hr style=\"border:0;border-top:1px solid #F1DFC7;margin:14px 0\" />
        <div style=\"display:flex;justify-content:space-between;font-size:14px\"><span>Subtotal</span><span>KES {int(order.get('subtotal',0)):,}</span></div>
        <div style=\"display:flex;justify-content:space-between;font-size:14px\"><span>Shipping</span><span>KES {int(order.get('shipping',0)):,}</span></div>
        <div style=\"display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#5C1519;margin-top:6px\"><span>Total</span><span>KES {int(order.get('total',0)):,}</span></div>
        <p style=\"margin-top:22px;color:#2A1B1CBF;font-size:13px\">Every purchase supports our creative wellbeing programs. We\u2019ll send delivery updates to this email.</p>
        <p style=\"margin-top:22px;font-family:'Fraunces',Georgia,serif;font-style:italic;color:#5C1519\">where art heals, tech empowers, & minds transform.</p>
      </div>
    </div>
    """


async def send_order_email(order: dict, paid: bool = False):
    if not RESEND_API_KEY:
        logger.info("Resend key missing \u2014 skipping email.")
        return
    to = order.get("customer", {}).get("email")
    if not to:
        return
    subject = "Your ArtNovaX order \u2014 " + (
        "payment received" if paid else "received"
    )
    html = _order_html(order, paid)
    async with httpx.AsyncClient(timeout=15) as client:
        # Customer
        await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html},
        )
        # Team copy
        if TEAM_EMAIL:
            await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [TEAM_EMAIL],
                    "subject": f"[New order] {subject}",
                    "html": html,
                },
            )


@api_router.get("/admin/newsletter")
async def admin_newsletter(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = (
        await db.newsletter_subscribers.find().sort("subscribed_at", -1).to_list(1000)
    )
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "subscribers": docs}


@api_router.get("/admin/contact")
async def admin_contact(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.contact_messages.find().sort("submitted_at", -1).to_list(1000)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "messages": docs}


@api_router.get("/admin/orders")
async def admin_orders(x_admin_token: str | None = Header(default=None)):
    require_admin(x_admin_token)
    docs = await db.orders.find().sort("created_at", -1).to_list(1000)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "orders": docs}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()

    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check["timestamp"], str):
            check["timestamp"] = datetime.fromisoformat(check["timestamp"])

    return status_checks
