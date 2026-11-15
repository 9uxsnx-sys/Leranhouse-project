"""Locale overlays for people entries (course instructors, podcast hosts).

The list itself is structural. It is stored on the base row so the number of
entries, their order and their avatars never drift between languages, while a
translation row only carries display text, index-aligned with the base list::

    base        [{"name": "Yacine Benali", "title": "Host & Founder", "avatar": "data:..."}]
    translation [{"name": "ياسين بن علي", "title": "المؤسس والمقدم"}]

`merge_localized_people` applies the localized list over the base metadata.
Blank or missing values keep the source text, and the avatar always comes from
the base row, so a translator cannot accidentally change someone's photo.
"""

from typing import Any, Optional

PEOPLE_TEXT_FIELDS = ("name", "title")


def merge_people(base: Any, localized: Any) -> Any:
    """Overlay index-aligned localized entries onto the shared base list."""
    if not isinstance(base, list) or not base:
        return base
    if not isinstance(localized, list) or not localized:
        return base

    merged = []
    for index, person in enumerate(base):
        if not isinstance(person, dict):
            merged.append(person)
            continue
        entry = dict(person)
        override = localized[index] if index < len(localized) else None
        if isinstance(override, dict):
            for field in PEOPLE_TEXT_FIELDS:
                value = override.get(field)
                if isinstance(value, str) and value.strip():
                    entry[field] = value
        merged.append(entry)
    return merged


def merge_localized_people(
    base_extra_metadata: Optional[dict],
    localized_extra_metadata: Optional[dict],
    key: str,
) -> dict:
    """Merge translation metadata, keeping the base `key` list index-aligned."""
    base_meta = base_extra_metadata or {}
    localized_meta = localized_extra_metadata or {}
    merged = {**base_meta, **localized_meta}
    if key in localized_meta:
        merged[key] = merge_people(base_meta.get(key), localized_meta.get(key))
    return merged
