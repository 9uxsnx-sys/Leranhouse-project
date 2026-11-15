"""Instructors and hosts are shared lists whose display text is per locale."""

from src.db.courses.course_translations import CourseTranslation
from src.services.courses.translations import _overlay_from_translation
from src.services.people_locale import merge_localized_people, merge_people

BASE_INSTRUCTORS = [
    {
        "name": "Yacine Benali",
        "title": "Founder and backend developer",
        "avatar": "data:image/png;base64,AAA",
    },
    {
        "name": "Lina Belkacem",
        "title": "Backend engineer",
        "avatar": "data:image/png;base64,BBB",
    },
]


def test_merge_people_overrides_text_and_keeps_avatar():
    merged = merge_people(
        BASE_INSTRUCTORS, [{"name": "ياسين بن علي", "title": "المؤسس"}]
    )

    assert merged[0]["name"] == "ياسين بن علي"
    assert merged[0]["title"] == "المؤسس"
    assert merged[0]["avatar"] == BASE_INSTRUCTORS[0]["avatar"]
    # Entries without a translation keep the source text.
    assert merged[1] == BASE_INSTRUCTORS[1]


def test_merge_people_keeps_source_for_blank_values():
    merged = merge_people(BASE_INSTRUCTORS, [{"name": "", "title": "   "}])

    assert merged[0] == BASE_INSTRUCTORS[0]


def test_merge_people_handles_missing_lists():
    assert merge_people(BASE_INSTRUCTORS, None) == BASE_INSTRUCTORS
    assert merge_people(BASE_INSTRUCTORS, []) == BASE_INSTRUCTORS
    assert merge_people(None, [{"name": "x"}]) is None


def test_merge_localized_people_only_touches_its_key():
    merged = merge_localized_people(
        {"instructors": BASE_INSTRUCTORS, "difficulty": "beginner"},
        {"instructors": [{"name": "ياسين بن علي"}], "duration": "6 hours"},
        "instructors",
    )

    assert merged["difficulty"] == "beginner"
    assert merged["duration"] == "6 hours"
    assert merged["instructors"][0]["name"] == "ياسين بن علي"
    assert merged["instructors"][0]["avatar"] == BASE_INSTRUCTORS[0]["avatar"]


def test_course_overlay_localizes_instructors_by_index():
    translation = CourseTranslation(
        course_id=1,
        locale="ar",
        name="هندسة الواجهة الخلفية ببايثون",
        extra_metadata={"instructors": [{"name": "ياسين بن علي"}]},
    )

    overlay = _overlay_from_translation(
        translation,
        {"instructors": BASE_INSTRUCTORS, "difficulty": "beginner"},
    )

    instructors = overlay["extra_metadata"]["instructors"]
    assert instructors[0]["name"] == "ياسين بن علي"
    assert instructors[0]["avatar"] == BASE_INSTRUCTORS[0]["avatar"]
    assert instructors[1]["name"] == "Lina Belkacem"
    assert overlay["extra_metadata"]["difficulty"] == "beginner"
