"""EXPLAIN-based perf guard for the hot analytics queries.

The tab queries run against real Postgres, so we can ask the planner directly
how they will be executed. This test captures the SQL each board issues, runs
``EXPLAIN`` on it, and asserts the high-growth tables (``trailstep``,
``trailrun``, ``analytics_events``, the community tables) are reached through an
index rather than a full sequential scan.

``enable_seqscan`` is turned off for the duration so the check does not depend
on how much data happens to be seeded. A ``Seq Scan`` on a big table then means
*no usable index exists* for that access path — the regression we want to catch
before the tables grow. Every one of these tables carries an ``org_id``-leading
index, which is the first predicate of every analytics query.
"""

from __future__ import annotations

import json

from sqlalchemy import event

from src.services.analytics.tabs import (
    audience,
    community,
    courses,
    learners,
    learning,
    overview,
    podcasts,
)
from src.tests.analytics import factories as f

RANGE = "30d"

# Tables the analytics queries read and that grow without bound in production.
# A sequential scan of any of these is the slow path we guard against.
BIG_TABLES = frozenset(
    {
        "trailstep",
        "trailrun",
        "analytics_events",
        "discussion",
        "discussioncomment",
        "discussionreaction",
        "userorganization",
    }
)


def _capture_selects(session, trigger) -> list[tuple[str, dict]]:
    """Run ``trigger`` and record every SELECT it sends, with its parameters."""
    captured: list[tuple[str, dict]] = []

    def before(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT") and isinstance(parameters, dict):
            captured.append((statement, dict(parameters)))

    event.listen(session.bind, "before_cursor_execute", before)
    try:
        trigger()
    finally:
        event.remove(session.bind, "before_cursor_execute", before)
    return captured


def _seq_scan_targets(connection, statement: str, parameters: dict) -> list[str]:
    """Relations that ``statement`` would sequentially scan (seqscan disabled)."""
    cursor = connection.connection.cursor()
    try:
        cursor.execute("SET LOCAL enable_seqscan = off")
        cursor.execute("EXPLAIN (FORMAT JSON) " + statement, parameters)
        payload = cursor.fetchone()[0]
    finally:
        cursor.close()

    if isinstance(payload, str):
        payload = json.loads(payload)

    found: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            if node.get("Node Type") == "Seq Scan":
                found.append(node.get("Relation Name"))
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(payload)
    return found


def _seed_hot_paths(session):
    """One org exercising every table the hot queries touch."""
    org = f.make_org(session)
    role = f.make_role(session, org)
    u1 = f.make_user(session, org, role, first="Alice", last="Adams")

    course = f.make_course(session, org, name="Course One")
    chapter = f.make_chapter(session, org, course)
    activity = f.make_activity(session, org, course, chapter)
    run = f.make_run(session, org, u1, course=course)
    f.make_step(session, org, run, activity=activity)

    podcast = f.make_podcast(session, org)
    episode = f.make_episode(session, org, podcast)
    pod_run = f.make_run(session, org, u1, podcast=podcast)
    f.make_step(session, org, pod_run, episode=episode)

    cm = f.make_community(session, org)
    discussion = f.make_discussion(session, org, cm, u1)
    f.make_comment(session, discussion, u1)
    f.make_reaction(session, discussion, u1)

    f.make_event(session, org, path="/x", device="mobile", visitor="v1")

    return org


def test_hot_queries_avoid_sequential_scans(pg):
    org = _seed_hot_paths(pg)

    def run_all_boards():
        overview.board(pg, org.id, RANGE)
        learning.board(pg, org.id, RANGE)
        audience.board(pg, org.id, RANGE)
        learners.board(pg, org.id, RANGE)
        courses.board(pg, org.id, RANGE)
        podcasts.board(pg, org.id, RANGE)
        community.board(pg, org.id, RANGE)

    statements = _capture_selects(pg, run_all_boards)
    assert statements, "expected the boards to issue SQL"

    joined = "\n".join(statement for statement, _ in statements)
    # guard against the check passing vacuously by capturing nothing relevant
    for table in ("trailstep", "trailrun", "analytics_events", "discussion"):
        assert table in joined, f"no captured query reads {table}"

    offenders: dict[str, list[str]] = {}
    for statement, parameters in statements:
        for relation in _seq_scan_targets(pg.connection(), statement, parameters):
            if relation in BIG_TABLES:
                offenders.setdefault(relation, []).append(statement.strip().splitlines()[0])

    assert not offenders, (
        "hot analytics queries fall back to a sequential scan on large tables "
        "(add a supporting index): "
        + ", ".join(f"{table} <- {queries[0]}" for table, queries in offenders.items())
    )
