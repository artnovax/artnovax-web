"""One-time/idempotent migration from the local ArtNovaX Mongo database to website Supabase.

Required backend/.env values:
  MONGO_URL, DB_NAME, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Run the SQL files under supabase/sql first, then:
  python scripts/migrate_website_to_supabase.py
"""

from __future__ import annotations

import os
import json
from pathlib import Path
from datetime import date, datetime
from typing import Any

import httpx
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

mongo = MongoClient(MONGO_URL)[DB_NAME]


def iso(value: Any):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def clean(value: Any):
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items() if k != "_id"}
    if isinstance(value, list):
        return [clean(v) for v in value]
    return iso(value)


# These columns have database-side defaults in the Supabase schema.
# If legacy Mongo/bundled data has no value, omit the key instead of
# explicitly sending JSON null, which would bypass the DEFAULT and can
# violate NOT NULL constraints.
DEFAULTABLE_COLUMNS = {
    "id",
    "created_at",
    "submitted_at",
    "subscribed_at",
}


def prepare_rows(rows: list[dict]) -> list[dict]:
    prepared = []
    for row in rows:
        prepared.append(
            {
                key: value
                for key, value in row.items()
                if not (key in DEFAULTABLE_COLUMNS and value is None)
            }
        )
    return prepared


def listify(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return [v.strip() for v in str(value).split(",") if v.strip()]


def upsert(table: str, rows: list[dict], conflict: str = "id") -> None:
    if not rows:
        print(f"{table}: 0 rows (skipped)")
        return

    rows = prepare_rows(rows)

    response = httpx.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params={"on_conflict": conflict},
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,missing=default,return=minimal",
        },
        json=clean(rows),
        timeout=60,
    )
    if response.is_error:
        raise RuntimeError(f"{table}: {response.status_code} {response.text}")
    print(f"{table}: migrated {len(rows)} rows")


def docs(collection: str) -> list[dict]:
    return list(mongo[collection].find({}))


def migrate_events():
    rows = []
    for e in docs("events"):
        rows.append(
            {
                "id": e["id"],
                "slug": e["slug"],
                "title": e["title"],
                "subtitle": e.get("subtitle"),
                "theme": e.get("theme"),
                "date_text": e.get("date"),
                "location": e.get("location"),
                "audience": e.get("audience"),
                "tags": listify(e.get("tags")),
                "body": e.get("body"),
                "image_path": e.get("img"),
                "status": e.get("status", "upcoming"),
                "featured": bool(e.get("featured", False)),
                "partners": listify(e.get("partners")),
                "poster": e.get("poster"),
                "capacity": e.get("capacity"),
                "reminder_hours": e.get("reminder_hours") or [48],
                "questions": e.get("questions") or [],
                "created_at": e.get("created_at"),
            }
        )
    upsert("events", rows)


def migrate_event_registrations():
    rows = []
    for r in docs("event_registrations"):
        rows.append(
            {
                k: r.get(k)
                for k in [
                    "id",
                    "event_id",
                    "event_slug",
                    "event_title",
                    "name",
                    "email",
                    "phone",
                    "answers",
                    "status",
                    "reminder_sent",
                    "reminder_sent_at",
                    "created_at",
                ]
                if k in r
            }
        )
    upsert("event_registrations", rows)


def migrate_volunteer():
    roles = []
    for r in docs("volunteer_roles"):
        roles.append(
            {
                "id": r["id"],
                "slug": r["slug"],
                "title": r["title"],
                "department": r.get("department"),
                "commitment": r.get("commitment"),
                "location": r.get("location"),
                "description": r.get("description"),
                "responsibilities": listify(r.get("responsibilities")),
                "requirements": listify(r.get("requirements")),
                "questions": r.get("questions") or [],
                "active": r.get("active", True),
                "created_at": r.get("created_at"),
            }
        )
    upsert("volunteer_roles", roles)

    apps = []
    for a in docs("volunteer_applications"):
        apps.append(
            {
                "id": a["id"],
                "role_id": a["role_id"],
                "name": a["name"],
                "email": a["email"],
                "phone": a.get("phone"),
                "answers": a.get("answers") or {},
                "status": a.get("status", "new"),
                "created_at": a.get("created_at"),
            }
        )
    upsert("volunteer_applications", apps)


def migrate_articles():
    source = docs("articles")
    if not source:
        bundled = Path(__file__).with_name("bundled_articles.json")
        if bundled.exists():
            source = json.loads(bundled.read_text(encoding="utf-8"))
            print(
                f"articles: Mongo is empty; using {len(source)} bundled research articles as initial CMS content"
            )
    rows = []
    for a in source:
        row = {
            "slug": a["slug"],
            "topic": a["topic"],
            "title": a["title"],
            "excerpt": a.get("excerpt"),
            "read": a.get("read", "6 min read"),
            "updated": a.get("updated"),
            "hero": a.get("hero"),
            "lead": a.get("lead"),
            "blocks": a.get("blocks") or [],
            "takeaways": listify(a.get("takeaways")),
            "tags": listify(a.get("tags")),
            "status": a.get("status", "published"),
            "created_at": a.get("created_at"),
        }
        if a.get("id"):
            row["id"] = a["id"]
        rows.append(row)
    upsert("articles", rows, "slug")


def migrate_founders():
    rows = []
    for f in docs("founders"):
        rows.append(
            {
                "id": f["id"],
                "slug": f["slug"],
                "name": f["name"],
                "role": f.get("role"),
                "short": f.get("short"),
                "bio": f.get("bio"),
                "img": f.get("img"),
                "linkedin": f.get("linkedin"),
                "funfact": f.get("funfact"),
                "medium": f.get("medium"),
                "why_art": f.get("why_art"),
                "display_order": f.get("order", 0),
                "created_at": f.get("created_at"),
            }
        )
    upsert("founders", rows)


def migrate_newsletter_and_waitlist():
    newsletter, waitlist = [], []
    for n in docs("newsletter_subscribers"):
        if n.get("source") == "app_waitlist":
            waitlist.append(
                {
                    "id": n.get("id"),
                    "email": n["email"],
                    "source": "legacy_newsletter",
                    "created_at": n.get("subscribed_at"),
                }
            )
        else:
            newsletter.append(
                {
                    "id": n.get("id"),
                    "email": n["email"],
                    "source": n.get("source"),
                    "subscribed_at": n.get("subscribed_at"),
                }
            )
    upsert("newsletter_subscribers", newsletter, "email")
    upsert("app_waitlist", waitlist, "email")


def migrate_contact():
    rows = []
    for m in docs("contact_messages"):
        rows.append(
            {
                "id": m["id"],
                "name": m["name"],
                "email": m["email"],
                "subject": m["subject"],
                "message": m["message"],
                "status": m.get("status", "new"),
                "submitted_at": m.get("submitted_at"),
            }
        )
    upsert("contact_messages", rows)


def migrate_partners():
    allowed = [
        "id",
        "org_name",
        "contact_name",
        "role",
        "email",
        "phone",
        "website",
        "org_type",
        "partnership_type",
        "goals",
        "audience",
        "budget",
        "timeline",
        "message",
        "status",
        "created_at",
    ]
    upsert(
        "partner_inquiries",
        [{k: p.get(k) for k in allowed if k in p} for p in docs("partner_inquiries")],
    )


def migrate_products():
    allowed = [
        "id",
        "name",
        "price",
        "currency",
        "category",
        "img",
        "description",
        "active",
        "created_at",
    ]
    upsert(
        "products", [{k: p.get(k) for k in allowed if k in p} for p in docs("products")]
    )


def main():
    print(f"Migrating Mongo database '{DB_NAME}' -> {SUPABASE_URL}")
    migrate_events()
    migrate_event_registrations()
    migrate_volunteer()
    migrate_articles()
    migrate_founders()
    migrate_newsletter_and_waitlist()
    migrate_contact()
    migrate_partners()
    migrate_products()
    print(
        "Migration complete. Re-running this script is safe; rows are upserted by id/email."
    )


if __name__ == "__main__":
    main()
