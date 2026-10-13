"""Fixtures for the analytics query tests.

The tab queries use Postgres-only SQL (`date_trunc`, `ILIKE`, `FILTER`,
`->>`, the quoted `"user"` identifier), so — unlike the rest of the suite,
which runs on in-memory SQLite — these tests need a real Postgres.

They connect to the configured database, seed rows inside a transaction and
roll the whole thing back, so the dev data is never modified. When no Postgres
is reachable the tests **skip** instead of failing, which keeps a SQLite-only
CI green while still guarding the queries wherever a database is available.
"""

from __future__ import annotations

import os

import pytest
from sqlalchemy import create_engine, text
from sqlmodel import Session

DEFAULT_URL = "postgresql+psycopg2://learnhouse:learnhouse@localhost:5434/learnhouse"


def _db_url() -> str:
    url = os.environ.get("LEARNHOUSE_SQL_CONNECTION_STRING", DEFAULT_URL)
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


@pytest.fixture(scope="session")
def pg_engine():
    """A Postgres engine, or a skip when the database is not reachable."""
    engine = create_engine(_db_url(), pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - environment dependent
        pytest.skip(f"Postgres not reachable at {_db_url()}: {exc}")
    yield engine
    engine.dispose()


@pytest.fixture
def pg(pg_engine):
    """A session whose writes are rolled back when the test finishes."""
    connection = pg_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
