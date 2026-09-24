"""Vercel ASGI entry point for the ANATOME FastAPI application."""

import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "back_end"

# Vercel Functions only guarantee writable storage under /tmp. For persistent
# reports, configure DATABASE_URL with a managed Postgres connection string.
if os.getenv("VERCEL"):
    os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/anatome.db")

sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402,F401
