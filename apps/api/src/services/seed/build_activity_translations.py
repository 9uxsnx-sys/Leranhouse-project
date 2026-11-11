"""Build ACTIVITY_TRANSLATIONS dict and append it to copy.py.

Reads Arabic translations from the database and French from french_translations.json,
then appends the complete ACTIVITY_TRANSLATIONS dict to the end of copy.py.
"""
import json
import subprocess
import os
from collections import OrderedDict

COPY_PY = os.path.join(os.path.dirname(__file__), "copy.py")
FRENCH_JSON = os.path.join(os.path.dirname(__file__), "french_translations.json")

LESSON_NAMES = [
    "How this course works",
    "What you need before we start",
    "Python, dependencies and a folder layout you can live with",
    "Git commits that tell the truth",
    "Writing your first endpoint",
    "Paths, query strings and request bodies",
    "Pydantic models that do not lie",
    "Error responses people can act on",
    "Tables, keys and the shape of a user",
    "Queries without guessing",
    "Migrations you can run twice",
    "Passwords, hashing and what never goes in a log",
    "Tokens and refresh without confusion",
    "Roles and the checks people forget",
    "Your first test that catches a real bug",
    "Fixtures and a separate test database",
    "Reading a stack trace calmly",
    "Docker without copying a tutorial",
    "Environment variables and secrets",
    "Deploying behind a reverse proxy",
    "One router per resource",
    "Protecting an endpoint end to end",
]


def get_arabic_from_db(lesson_name: str) -> dict | None:
    """Query the DB for Arabic translation data for a lesson."""
    sql = f"""SELECT extra_metadata->'translations'->'ar' as ar_data
FROM activity
WHERE name = '{lesson_name.replace("'", "''")}'
AND extra_metadata->'translations'->'ar' IS NOT NULL
LIMIT 1;"""
    result = subprocess.run(
        ["docker", "exec", "learnhouse-db-dev", "psql", "-U", "learnhouse", "-d", "learnhouse", "-t", "-A", "-c", sql],
        capture_output=True, text=True, timeout=15,
    )
    output = result.stdout.strip()
    if not output or result.returncode != 0:
        print(f"  WARNING: No Arabic data found for '{lesson_name}'")
        return None
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        print(f"  WARNING: Could not parse Arabic data for '{lesson_name}'")
        return None


def format_python_value(val, indent: int = 0) -> str:
    """Format a Python value as pretty-printed Python code."""
    pad = "    " * indent
    inner = "    " * (indent + 1)

    if val is None:
        return "None"
    if isinstance(val, bool):
        return "True" if val else "False"
    if isinstance(val, int):
        return str(val)
    if isinstance(val, str):
        # Escape quotes and special chars
        escaped = val.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
        return f"'{escaped}'"
    if isinstance(val, list):
        if not val:
            return "[]"
        # Check if all items are simple strings (short list)
        if all(isinstance(v, str) for v in val):
            items = ",\n".join(f"{inner}{format_python_value(v, indent+1)}" for v in val)
            return f"[\n{items},\n{pad}]"
        items = ",\n".join(f"{inner}{format_python_value(v, indent+1)}" for v in val)
        return f"[\n{items},\n{pad}]"
    if isinstance(val, dict):
        if not val:
            return "{}"
        items = []
        for k, v in val.items():
            formatted_val = format_python_value(v, indent + 1)
            items.append(f"{inner}{format_python_value(k, indent+1)}: {formatted_val},")
        return "{\n" + "\n".join(items) + "\n" + pad + "}"
    return str(val)


def main():
    print("Reading French translations...")
    with open(FRENCH_JSON, "r", encoding="utf-8") as f:
        french_data = json.load(f)
    print(f"  Loaded {len(french_data)} lessons from French JSON")

    print("\nReading Arabic translations from database...")
    arabic_data = {}
    for name in LESSON_NAMES:
        data = get_arabic_from_db(name)
        if data:
            arabic_data[name] = data
            print(f"  OK: {name}")
        else:
            print(f"  MISSING: {name}")
    print(f"  Total Arabic lessons loaded: {len(arabic_data)}")

    # Build the ACTIVITY_TRANSLATIONS dict
    print("\nBuilding ACTIVITY_TRANSLATIONS dict...")
    lines = []
    lines.append("")
    lines.append("")
    lines.append("# ── Activity / lesson translations ──────────────────────────────────")
    lines.append("ACTIVITY_TRANSLATIONS: dict[str, dict[str, dict]] = {")

    for name in LESSON_NAMES:
        ar = arabic_data.get(name)
        fr = french_data.get(name)

        if not ar and not fr:
            print(f"  SKIPPING (no data): {name}")
            continue

        # Build locale dict
        locale_entries = []
        if ar:
            ar_str = format_python_value(ar, 2)
            locale_entries.append(f"        \"ar\": {ar_str},")
        if fr:
            fr_str = format_python_value(fr, 2)
            locale_entries.append(f"        \"fr\": {fr_str},")

        name_escaped = name.replace("\\", "\\\\").replace("'", "\\'")
        lines.append(f"    \"{name_escaped}\": {{")
        lines.extend(locale_entries)
        lines.append("    },")

    lines.append("}")

    output = "\n".join(lines)

    print(f"\nAppending to {COPY_PY}...")
    with open(COPY_PY, "a", encoding="utf-8") as f:
        f.write(output)

    print("Done! ACTIVITY_TRANSLATIONS appended to copy.py")


if __name__ == "__main__":
    main()
