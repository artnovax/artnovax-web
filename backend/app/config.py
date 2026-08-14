import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "artnovax")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "ArtNovaX <onboarding@resend.dev>")
TEAM_EMAIL = os.getenv("TEAM_EMAIL", "hello@artnovax.org")

PUBLIC_ORIGIN = os.getenv("PUBLIC_ORIGIN", "http://localhost:3000").rstrip("/")
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", PUBLIC_ORIGIN).rstrip("/")
BRAND_LOGO_URL = os.getenv(
    "BRAND_LOGO_URL", f"{PUBLIC_ORIGIN}/images/artnovax-wordmark.png"
)

MPESA_ENV = os.getenv("MPESA_ENV", "sandbox").lower()
MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "")
MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "")
MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "174379")
MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "")
MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "")
