"""Integration tests for the 7 analytics tab builders.

Each test seeds a throwaway org through the `factories` helpers, runs the real
`board(...)` against Postgres and asserts *exact* numbers, then the `pg` fixture
rolls everything back. This is the committed, re-runnable version of the manual
verification that shipped with the tabs.
"""

from __future__ import annotations

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


def total(series: list[dict], key: str) -> int:
    """Sum one series across every bucket — robust to date-boundary drift."""
    return sum(point[key] for point in series)


def by_name(rows: list[dict]) -> dict[str, dict]:
    return {row["name"]: row for row in rows}


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------
def test_overview_board(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams")
    u2 = f.make_user(pg, org, role, first="Bob", last="Brown")
    u3 = f.make_user(pg, org, role, first="Cara", last="Cole")
    course = f.make_course(pg, org, name="Course One")

    r1 = f.make_run(pg, org, u1, course=course, created=f.days_ago(2))
    r2 = f.make_run(pg, org, u2, course=course, status=f.StatusEnum.STATUS_COMPLETED, created=f.days_ago(2))
    f.make_run(pg, org, u3, course=course, status=f.StatusEnum.STATUS_COMPLETED, created=f.days_ago(2))

    f.make_step(pg, org, r1, created=f.days_ago(1))
    f.make_step(pg, org, r2, created=f.days_ago(1))

    cards = overview.board(pg, org.id, RANGE)

    assert set(cards) == {
        "activity_trend",
        "enrollments_trend",
        "enrollment_stage",
        "top_courses",
        "completion_by_course",
    }

    # distinct learners with a step = u1, u2; signups = the 3 memberships
    assert total(cards["activity_trend"]["data"], "learners") == 2
    assert total(cards["activity_trend"]["data"], "signups") == 3

    assert total(cards["enrollments_trend"]["data"], "value") == 3

    stages = {row["label"]: row["value"] for row in cards["enrollment_stage"]["data"]}
    assert stages == {"Enrolled": 3, "Started": 2, "Completed": 2}

    assert cards["top_courses"]["data"] == [{"name": "Course One", "value": 3}]
    # 2/3 completed → Postgres `::int` rounds the ratio, so 66.67 becomes 67
    assert cards["completion_by_course"]["data"] == [{"name": "Course One", "value": 67}]


# ---------------------------------------------------------------------------
# Learning
# ---------------------------------------------------------------------------
def test_learning_board(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams")
    u2 = f.make_user(pg, org, role, first="Bob", last="Brown")

    course = f.make_course(pg, org, name="Course One")
    chapter = f.make_chapter(pg, org, course)
    a1 = f.make_activity(pg, org, course, chapter, order=1, name="Lesson A")
    a2 = f.make_activity(
        pg,
        org,
        course,
        chapter,
        order=2,
        name="Lesson B",
        activity_type=f.ActivityTypeEnum.TYPE_DOCUMENT,
        subtype=f.ActivitySubTypeEnum.SUBTYPE_DOCUMENT_PDF,
    )

    r1 = f.make_run(pg, org, u1, course=course, status=f.StatusEnum.STATUS_COMPLETED, created=f.days_ago(3))
    r2 = f.make_run(pg, org, u2, course=course, created=f.days_ago(3))

    f.make_step(pg, org, r1, activity=a1, complete=True, created=f.days_ago(2))
    f.make_step(pg, org, r1, activity=a2, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r2, activity=a1, complete=True, created=f.days_ago(2))
    f.make_step(pg, org, r2, activity=a2, complete=False, created=f.days_ago(1))

    f.make_event(
        pg, org, name="time_on_activity", created=f.days_ago(1), user=u1,
        duration_ms=180_000, properties={"activity_uuid": a1.activity_uuid},
    )
    f.make_event(
        pg, org, name="time_on_activity", created=f.days_ago(1), user=u2,
        duration_ms=60_000, properties={"activity_uuid": a2.activity_uuid},
    )

    cards = learning.board(pg, org.id, RANGE)

    assert set(cards) == {
        "learning_trend",
        "completion_by_course",
        "lesson_dropoff",
        "time_on_activity",
        "content_type_effectiveness",
    }

    assert total(cards["learning_trend"]["data"], "starts") == 2
    assert total(cards["learning_trend"]["data"], "completions") == 1
    assert cards["completion_by_course"]["data"] == [{"name": "Course One", "value": 50}]

    # position 1 of 2 → bin 0; position 2 of 2 → bin 9
    dropoff = cards["lesson_dropoff"]["data"]
    assert dropoff[0]["value"] == 2
    assert dropoff[9]["value"] == 1

    # 180000 ms → 3 min on a video, 60000 ms → 1 min on a document
    assert by_name(cards["time_on_activity"]["data"]) == {
        "Video": {"name": "Video", "value": 3},
        "Document": {"name": "Document", "value": 1},
    }

    # video: 2/2 complete; document: 1/2 complete
    assert by_name(cards["content_type_effectiveness"]["data"]) == {
        "Video": {"name": "Video", "value": 100},
        "Document": {"name": "Document", "value": 50},
    }


# ---------------------------------------------------------------------------
# Audience
# ---------------------------------------------------------------------------
def test_audience_board(pg):
    org = f.make_org(pg)

    f.make_event(pg, org, path="/a", referrer=None, device="desktop", visitor="vis-1", created=f.days_ago(1))
    f.make_event(pg, org, path="/a", referrer="https://www.google.com/search", device="mobile", visitor="vis-1", created=f.days_ago(1))
    f.make_event(pg, org, path="/b", referrer="https://facebook.com/post", device="mobile", visitor="vis-2", created=f.days_ago(1))
    f.make_event(pg, org, path="/b", referrer=None, device="mobile", visitor="vis-2", created=f.days_ago(1))
    # previous window: one extra hit on /a, so the "change" column is exercised
    f.make_event(pg, org, path="/a", referrer=None, device="desktop", visitor="vis-9", created=f.days_ago(31))

    cards = audience.board(pg, org.id, RANGE)

    assert set(cards) == {"traffic_trend", "sources", "devices", "top_pages"}

    assert total(cards["traffic_trend"]["data"], "visits") == 4
    assert total(cards["traffic_trend"]["data"], "visitors") == 2

    assert by_name(cards["sources"]["data"]) == {
        "Direct": {"name": "Direct", "value": 2},
        "google.com": {"name": "google.com", "value": 1},
        "facebook.com": {"name": "facebook.com", "value": 1},
    }

    assert by_name(cards["devices"]["data"]) == {
        "Desktop": {"name": "Desktop", "value": 25},
        "Mobile": {"name": "Mobile", "value": 75},
    }

    pages = {row["path"]: row for row in cards["top_pages"]["rows"]}
    assert pages["/a"] == {"path": "/a", "views": 2, "visitors": 1, "change": 100}
    assert pages["/b"] == {"path": "/b", "views": 2, "visitors": 1, "change": 0}


# ---------------------------------------------------------------------------
# Learners
# ---------------------------------------------------------------------------
def test_learners_table_search_and_pagination(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org, name="Admin")
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams", verified=True, joined=f.days_ago(5))
    u2 = f.make_user(pg, org, role, first="Bob", last="Brown", verified=False, joined=f.days_ago(1))

    card = learners.board(pg, org.id, RANGE)["learners_table"]
    assert card["total"] == 2
    assert card["page"] == 1 and card["pageSize"] == 50
    # newest membership first
    assert [row["name"] for row in card["rows"]] == ["Bob Brown", "Alice Adams"]
    assert card["rows"][0]["verified"] is False
    assert card["rows"][0]["role"] == "Admin"
    assert card["rows"][0]["joined"] == f.days_ago(1).date().isoformat()

    found = learners.board(pg, org.id, RANGE, q="alice")["learners_table"]
    assert found["total"] == 1
    assert found["rows"][0]["id"] == u1.id

    by_username = learners.board(pg, org.id, RANGE, q=u2.username)["learners_table"]
    assert by_username["total"] == 1
    assert by_username["rows"][0]["id"] == u2.id


def test_learner_detail_and_progress(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams")

    course = f.make_course(pg, org, name="Course One")
    chapter = f.make_chapter(pg, org, course)
    a1 = f.make_activity(pg, org, course, chapter, order=1)
    a2 = f.make_activity(pg, org, course, chapter, order=2)

    run = f.make_run(pg, org, u1, course=course)
    f.make_step(pg, org, run, activity=a1, complete=True, created=f.days_ago(2))
    f.make_step(pg, org, run, activity=a2, complete=False, created=f.days_ago(1))

    detail = learners.learner_detail(pg, org.id, u1.id)

    assert detail is not None
    assert detail["user"]["name"] == "Alice Adams"
    assert detail["user"]["email"] == u1.email
    assert detail["user"]["last_active"].startswith(f.days_ago(1).date().isoformat())
    assert detail["courses"] == [{"name": "Course One", "progress": 50}]

    # a user who is not a member of the org has no detail
    other = f.make_org(pg, name="Other Org")
    assert learners.learner_detail(pg, other.id, u1.id) is None


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------
def _seed_courses(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams")
    u2 = f.make_user(pg, org, role, first="Bob", last="Brown")
    u3 = f.make_user(pg, org, role, first="Cara", last="Cole")

    c1 = f.make_course(pg, org, name="Course One")
    ch1 = f.make_chapter(pg, org, c1, order=1)
    a1 = f.make_activity(pg, org, c1, ch1, order=1, name="Lesson A")
    a2 = f.make_activity(pg, org, c1, ch1, order=2, name="Lesson B")

    c2 = f.make_course(pg, org, name="Course Two")
    ch2 = f.make_chapter(pg, org, c2, order=1)
    a3 = f.make_activity(pg, org, c2, ch2, order=1, name="Lesson C")

    r1 = f.make_run(pg, org, u1, course=c1, status=f.StatusEnum.STATUS_COMPLETED, created=f.days_ago(2))
    r2 = f.make_run(pg, org, u2, course=c1, created=f.days_ago(2))
    r3 = f.make_run(pg, org, u3, course=c2, status=f.StatusEnum.STATUS_COMPLETED, created=f.days_ago(2))

    f.make_step(pg, org, r1, activity=a1, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r1, activity=a2, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r2, activity=a1, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r3, activity=a3, complete=True, created=f.days_ago(1))

    f.make_event(
        pg, org, name="time_on_activity", created=f.days_ago(1), user=u1,
        duration_ms=300_000, properties={"activity_uuid": a1.activity_uuid},
    )
    return org, c1, c2


def test_courses_board_all_courses(pg):
    org, c1, _c2 = _seed_courses(pg)

    cards = courses.board(pg, org.id, RANGE)

    assert set(cards) == {
        "course_enrollment_trend",
        "course_completion_funnel",
        "course_learner_progress",
        "course_lesson_dropoff",
        "course_time_per_lesson",
        "course_students",
    }

    assert total(cards["course_enrollment_trend"]["data"], "enrollments") == 3
    assert total(cards["course_enrollment_trend"]["data"], "active") == 3

    funnel = {row["name"]: row["value"] for row in cards["course_completion_funnel"]["data"]}
    assert funnel == {"Enrolled": 3, "Started": 3, "Halfway": 3, "Completed": 2}

    progress = {row["name"]: row["value"] for row in cards["course_learner_progress"]["data"]}
    assert progress["75–100%"] == 2  # r1 (100%) + r3 (100%)
    assert progress["50–75%"] == 1  # r2 (50%)

    lessons = by_name(cards["course_lesson_dropoff"]["data"])
    assert lessons["Lesson A"]["value"] == 2
    assert lessons["Lesson B"]["value"] == 1
    assert lessons["Lesson C"]["value"] == 1

    assert cards["course_time_per_lesson"]["data"] == [{"name": "Lesson A", "value": 5}]

    students = {row["name"]: row for row in cards["course_students"]["rows"]}
    assert students["Alice Adams"]["progress"] == 100
    assert students["Alice Adams"]["status"] == "Completed"
    assert students["Bob Brown"]["progress"] == 50
    assert students["Bob Brown"]["status"] == "In progress"
    assert students["Cara Cole"]["status"] == "Completed"


def test_courses_board_is_scoped_to_one_course(pg):
    org, c1, _c2 = _seed_courses(pg)

    cards = courses.board(pg, org.id, RANGE, entity=c1.course_uuid)

    assert total(cards["course_enrollment_trend"]["data"], "enrollments") == 2
    assert total(cards["course_enrollment_trend"]["data"], "active") == 2

    funnel = {row["name"]: row["value"] for row in cards["course_completion_funnel"]["data"]}
    assert funnel == {"Enrolled": 2, "Started": 2, "Halfway": 2, "Completed": 1}

    lessons = by_name(cards["course_lesson_dropoff"]["data"])
    assert set(lessons) == {"Lesson A", "Lesson B"}  # Lesson C belongs to the other course
    assert {row["name"] for row in cards["course_students"]["rows"]} == {"Alice Adams", "Bob Brown"}


# ---------------------------------------------------------------------------
# Podcasts
# ---------------------------------------------------------------------------
def test_podcasts_board(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams")
    u2 = f.make_user(pg, org, role, first="Bob", last="Brown")

    p1 = f.make_podcast(pg, org, name="Show One")
    e1 = f.make_episode(pg, org, p1, number=1, title="Ep One", duration=600, published=True)
    e2 = f.make_episode(pg, org, p1, number=2, title="Ep Two", duration=1200, published=False)

    p2 = f.make_podcast(pg, org, name="Show Two")
    e3 = f.make_episode(pg, org, p2, number=1, title="Extra", duration=300, published=True)

    r1 = f.make_run(pg, org, u1, podcast=p1, created=f.days_ago(2))
    r2 = f.make_run(pg, org, u2, podcast=p1, status=f.StatusEnum.STATUS_COMPLETED, created=f.days_ago(2))
    r3 = f.make_run(pg, org, u1, podcast=p2, created=f.days_ago(2))

    f.make_step(pg, org, r1, episode=e1, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r2, episode=e1, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r2, episode=e2, complete=True, created=f.days_ago(1))
    f.make_step(pg, org, r3, episode=e3, complete=True, created=f.days_ago(1))

    # e1: two chunks for a single listener → 6 min total (AVG would wrongly say 3)
    f.make_event(pg, org, name="time_on_activity", created=f.days_ago(1), user=u1, duration_ms=180_000, properties={"episode_uuid": e1.episode_uuid})
    f.make_event(pg, org, name="time_on_activity", created=f.days_ago(1), user=u1, duration_ms=180_000, properties={"episode_uuid": e1.episode_uuid})
    f.make_event(pg, org, name="time_on_activity", created=f.days_ago(1), user=u2, duration_ms=600_000, properties={"episode_uuid": e2.episode_uuid})

    cards = podcasts.board(pg, org.id, RANGE)

    assert set(cards) == {
        "podcast_listening_trend",
        "podcast_episode_plays",
        "podcast_episode_completion",
        "podcast_length_vs_listened",
        "podcast_series_progress",
        "podcast_episodes",
    }

    assert total(cards["podcast_listening_trend"]["data"], "starts") == 3
    assert total(cards["podcast_listening_trend"]["data"], "completions") == 4

    plays = by_name(cards["podcast_episode_plays"]["data"])
    assert plays["Ep 1 · Ep One"]["value"] == 2
    assert plays["Ep 2 · Ep Two"]["value"] == 1
    assert plays["Ep 1 · Extra"]["value"] == 1

    # Ordered by episode_number, so both number-1 episodes precede number 2.
    # e1: 2 chunks × 180000 ms for one listener → 6 min (AVG would say 3).
    pairs = {(row["length"], row["listened"]) for row in cards["podcast_length_vs_listened"]["data"]}
    assert pairs == {(10, 6), (20, 10), (5, 0)}
    assert (10, 6) in pairs  # chunk-proof: sum ÷ distinct listeners, not AVG(rows)

    progress = {row["name"]: row["value"] for row in cards["podcast_series_progress"]["data"]}
    assert progress["50–75%"] == 2  # u1 finished 2/3, u2 finished 2/3

    episodes = {row["title"]: row for row in cards["podcast_episodes"]["rows"]}
    assert episodes["Ep One"]["status"] == "Published"
    assert episodes["Ep One"]["duration"] == "10m 00s"
    assert episodes["Ep One"]["plays"] == 2
    assert episodes["Ep One"]["completion"] == 100
    assert episodes["Ep Two"]["status"] == "Draft"
    assert episodes["Ep Two"]["duration"] == "20m 00s"


def test_podcasts_board_is_scoped_to_one_podcast(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role)
    u2 = f.make_user(pg, org, role)

    p1 = f.make_podcast(pg, org, name="Show One")
    f.make_episode(pg, org, p1, number=1, title="Ep One", duration=600)
    f.make_episode(pg, org, p1, number=2, title="Ep Two", duration=1200)

    p2 = f.make_podcast(pg, org, name="Show Two")
    f.make_episode(pg, org, p2, number=1, title="Extra", duration=300)

    f.make_run(pg, org, u1, podcast=p1, created=f.days_ago(2))
    f.make_run(pg, org, u2, podcast=p1, created=f.days_ago(2))
    f.make_run(pg, org, u1, podcast=p2, created=f.days_ago(2))

    scoped = podcasts.board(pg, org.id, RANGE, entity=p1.podcast_uuid)
    assert total(scoped["podcast_listening_trend"]["data"], "starts") == 2
    assert len(scoped["podcast_length_vs_listened"]["data"]) == 2

    all_shows = podcasts.board(pg, org.id, RANGE)
    assert total(all_shows["podcast_listening_trend"]["data"], "starts") == 3
    assert len(all_shows["podcast_length_vs_listened"]["data"]) == 3


# ---------------------------------------------------------------------------
# Community
# ---------------------------------------------------------------------------
def _seed_community(pg):
    org = f.make_org(pg)
    role = f.make_role(pg, org)
    u1 = f.make_user(pg, org, role, first="Alice", last="Adams")
    u2 = f.make_user(pg, org, role, first="Bob", last="Brown")
    u3 = f.make_user(pg, org, role, first="Cara", last="Cole")

    cm = f.make_community(pg, org, name="Lounge")
    d1 = f.make_discussion(pg, org, cm, u1, title="Hello", label="general", upvotes=5, created=f.days_ago(2))
    d2 = f.make_discussion(pg, org, cm, u2, title="How?", label="question", upvotes=3, created=f.days_ago(1))
    f.make_discussion(pg, org, cm, u3, title="Unanswered?", label="question", upvotes=9, created=f.days_ago(1))

    f.make_comment(pg, d1, u2)
    f.make_comment(pg, d1, u3)
    f.make_comment(pg, d2, u1)

    f.make_reaction(pg, d1, u1)
    f.make_reaction(pg, d1, u2)
    f.make_reaction(pg, d2, u1)
    return org


def test_community_board_trend_and_labels(pg):
    org = _seed_community(pg)

    cards = community.board(pg, org.id, RANGE)

    assert set(cards) == {
        "community_activity_trend",
        "community_by_label",
        "community_detail_table",
    }

    assert total(cards["community_activity_trend"]["data"], "discussions") == 3
    assert total(cards["community_activity_trend"]["data"], "comments") == 3

    labels = {row["name"]: row["value"] for row in cards["community_by_label"]["data"]}
    assert labels == {"Q&A": 2, "General": 1}


def test_community_contributors_view(pg):
    org = _seed_community(pg)

    card = community.board(pg, org.id, RANGE, view="contributors")["community_detail_table"]
    rows = by_name(card["rows"])
    # Alice wrote 1 discussion + 1 comment + 2 reactions
    assert rows["Alice Adams"] == {"name": "Alice Adams", "discussions": 1, "comments": 1, "reactions": 2}
    assert rows["Bob Brown"]["reactions"] == 1
    assert rows["Cara Cole"]["reactions"] == 0
    # ordered by total activity, so Alice leads
    assert card["rows"][0]["name"] == "Alice Adams"


def test_community_discussions_view(pg):
    org = _seed_community(pg)

    card = community.board(pg, org.id, RANGE, view="discussions")["community_detail_table"]
    rows = {row["title"]: row for row in card["rows"]}
    assert card["rows"][0]["title"] == "Unanswered?"  # 9 upvotes, no replies
    assert rows["Hello"] == {"title": "Hello", "label": "General", "replies": 2, "upvotes": 5}
    assert rows["How?"] == {"title": "How?", "label": "Q&A", "replies": 1, "upvotes": 3}


def test_community_questions_view_and_invalid_fallback(pg):
    org = _seed_community(pg)

    card = community.board(pg, org.id, RANGE, view="questions")["community_detail_table"]
    # only "Unanswered?" is a question without replies
    assert len(card["rows"]) == 1
    assert card["rows"][0]["title"] == "Unanswered?"
    assert card["rows"][0]["author"] == "Cara Cole"
    assert card["rows"][0]["upvotes"] == 9

    fallback = community.board(pg, org.id, RANGE, view="nonsense")["community_detail_table"]
    contributors = community.board(pg, org.id, RANGE, view="contributors")["community_detail_table"]
    assert fallback["rows"] == contributors["rows"]
