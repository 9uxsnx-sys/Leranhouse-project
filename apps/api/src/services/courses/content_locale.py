"""Locale overlays for chapter and activity content.

Chapters and activities keep their authored text on the base row. Translations
live in ``extra_metadata["translations"][locale]``::

    {
      "translations": {
        "fr": {"name": "...", "description": "..."},
        "ar": {"name": "...", "content": { ...TipTap doc... }}
      }
    }

The source row is never mutated; the overlay is applied to the read model so
every request can serve a different locale from the same cache entry.
"""

from typing import Optional

from src.db.courses.activities import ActivityRead
from src.db.courses.chapters import ChapterRead


def _translation_for(extra_metadata: Optional[dict], locale: Optional[str]) -> dict:
    if not extra_metadata or not locale:
        return {}
    translations = extra_metadata.get("translations")
    if not isinstance(translations, dict):
        return {}
    value = translations.get(locale)
    return value if isinstance(value, dict) else {}


def apply_chapter_locale(chapter: ChapterRead, locale: Optional[str]) -> None:
    """Override a chapter's display fields in place when a translation exists."""
    data = _translation_for(chapter.extra_metadata, locale)
    if not data:
        return
    name = data.get("name")
    if isinstance(name, str) and name.strip():
        chapter.name = name
    description = data.get("description")
    if isinstance(description, str):
        chapter.description = description


def apply_activity_locale(
    activity: ActivityRead, locale: Optional[str], include_content: bool = True
) -> None:
    """Override an activity's name/content in place when a translation exists."""
    data = _translation_for(activity.extra_metadata, locale)
    if not data:
        return
    name = data.get("name")
    if isinstance(name, str) and name.strip():
        activity.name = name
    content = data.get("content")
    if include_content and isinstance(content, dict) and content:
        activity.content = content


def apply_course_content_locale(chapters: list[ChapterRead], locale: Optional[str]) -> None:
    """Apply chapter + activity overlays to a course tree in one pass."""
    if not locale:
        return
    for chapter in chapters:
        apply_chapter_locale(chapter, locale)
        for activity in chapter.activities:
            apply_activity_locale(activity, locale)
