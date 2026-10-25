"""Creates the demo organization and its configuration."""

from __future__ import annotations

from src.db.organization_config import OrganizationConfig
from src.db.organizations import Organization
from src.services.seed.core import (
    DEMO_EMAIL,
    DEMO_NAME,
    DEMO_SLUG,
    SeedContext,
    iso,
    new_uuid,
)

ALL_FEATURES_ON = {
    "ai": {"enabled": True, "limit": 10, "model": ""},
    "analytics": {"enabled": True, "limit": 10},
    "api": {"enabled": True, "limit": 10},
    "assignments": {"enabled": True, "limit": 10},
    "boards": {"enabled": True, "limit": 10},
    "collaboration": {"enabled": True, "limit": 10},
    "collections": {"enabled": True},
    "communities": {"enabled": True},
    "courses": {"enabled": True, "limit": 10},
    "discussions": {"enabled": True, "limit": 10},
    "members": {"enabled": True, "signup_mode": "open", "admin_limit": 1, "limit": 10},
    "payments": {"enabled": True},
    "playgrounds": {"enabled": True, "limit": 10},
    "podcasts": {"enabled": True, "limit": 10},
    "storage": {"enabled": True, "limit": 10},
    "usergroups": {"enabled": True, "limit": 10},
}


def _config() -> dict:
    return {
        "config_version": "2.0",
        "active": True,
        "plan": "oss",
        "admin_toggles": {
            "ai": {"disabled": True, "copilot_enabled": False},
            "analytics": {"disabled": False},
            "api": {"disabled": False},
            "boards": {"disabled": False},
            "collaboration": {"disabled": False},
            "collections": {"disabled": False},
            "communities": {"disabled": False},
            "members": {"disabled": False, "signup_mode": "open"},
            "payments": {"disabled": False},
            "playgrounds": {"disabled": False},
            "podcasts": {"disabled": False},
        },
        "overrides": {},
        "customization": {
            "general": {
                "color": "#111827",
                "footer_text": "Koodook Academy, built in Algeria",
                "favicon_image": "",
                "watermark": True,
                "font": "",
                "default_language": "en",
            },
            "auth_branding": {
                "welcome_message": "Pick up where you left off.",
                "background_type": "gradient",
                "background_image": "",
                "text_color": "light",
            },
            "seo": {
                "default_meta_title_suffix": "Koodook Academy",
                "default_meta_description": "Short practical courses for designers and developers. Built by people who ship.",
                "default_og_image": "",
                "google_site_verification": "",
                "twitter_handle": "",
                "noindex_communities": False,
            },
            "landing": {},
        },
        # v1 shape kept in sync for code paths that still read it
        "features": ALL_FEATURES_ON,
        "cloud": {"plan": "oss", "custom_domain": False},
        "general": {
            "enabled": True,
            "color": "#111827",
            "footer_text": "Koodook Academy, built in Algeria",
            "watermark": True,
            "favicon_image": "",
            "auth_branding": {
                "welcome_message": "Pick up where you left off.",
                "background_type": "gradient",
                "background_image": "",
                "text_color": "light",
            },
        },
        "landing": {},
        "seo": {
            "default_meta_title_suffix": "Koodook Academy",
            "default_meta_description": "Short practical courses for designers and developers.",
        },
    }


def create_org(ctx: SeedContext) -> Organization:
    org_uuid = new_uuid("org")
    org = Organization(
        name=DEMO_NAME,
        description="Short practical courses for designers and developers. We teach the parts that survive contact with a real project.",
        about=(
            "Koodook Academy started as a study group in Algiers. We kept meeting, kept teaching, "
            "and eventually turned the sessions into courses. Everything here is built around one idea: "
            "finish something real before you move to the next thing."
        ),
        socials={"instagram": "https://instagram.com/koodookacademy"},
        links={"website": "https://koodook.academy"},
        scripts={},
        logo_image="",
        thumbnail_image="",
        previews={},
        label="Learning studio",
        email=DEMO_EMAIL,
        org_uuid=org_uuid,
        slug=DEMO_SLUG,
        explore=True,
        creation_date=iso(ctx.date_between(400, 380)),
        update_date=iso(ctx.now),
    )

    ctx.session.add(org)
    ctx.session.commit()
    ctx.session.refresh(org)

    ctx.org = org
    ctx.org_id = int(org.id or 0)
    ctx.org_uuid = org.org_uuid

    config = OrganizationConfig(
        org_id=ctx.org_id,
        config=_config(),
        creation_date=iso(ctx.now),
        update_date=iso(ctx.now),
    )
    ctx.session.add(config)
    ctx.session.commit()

    return org
