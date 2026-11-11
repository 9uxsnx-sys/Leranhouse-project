import os
from typing import Annotated, Optional
from sqlalchemy import create_engine
from sqlmodel import SQLModel, Session, select
import typer
from config.config import get_learnhouse_config
from src.db.organizations import OrganizationCreate
from src.db.users import UserCreate
from src.db.courses.chapters import Chapter
from src.services.setup.setup import (
    install_create_organization,
    install_create_organization_user,
    install_default_elements,
)

cli = typer.Typer()

CHAPTER_TRANSLATIONS = {
    "Introduction": {
        "fr": {"name": "Introduction", "description": "Deux courtes vidéos avant le début des modules hebdomadaires."},
        "ar": {"name": "مقدمة", "description": "فيديوين قصيرين قبل بدء الوحدات الأسبوعية."},
    },
    "Week 1: A project that starts clean": {
        "fr": {"name": "Semaine 1 : Un projet qui démarre proprement", "description": "Ce que nous couvrons dans la semaine 1."},
        "ar": {"name": "الأسبوع 1: مشروع يبدأ بشكل نظيف", "description": "ما نغطيه في الأسبوع 1."},
    },
    "Week 2: Requests and responses": {
        "fr": {"name": "Semaine 2 : Requêtes et réponses", "description": "Ce que nous couvrons dans la semaine 2."},
        "ar": {"name": "الأسبوع 2: الطلبات والاستجابات", "description": "ما نغطيه في الأسبوع 2."},
    },
    "Week 3: Database and migrations": {
        "fr": {"name": "Semaine 3 : Base de données et migrations", "description": "Ce que nous couvrons dans la semaine 3."},
        "ar": {"name": "الأسبوع 3: قاعدة البيانات والترحيل", "description": "ما نغطيه في الأسبوع 3."},
    },
    "Week 4: Auth and permissions": {
        "fr": {"name": "Semaine 4 : Authentification et autorisations", "description": "Ce que nous couvrons dans la semaine 4."},
        "ar": {"name": "الأسبوع 4: المصادقة والأذونات", "description": "ما نغطيه في الأسبوع 4."},
    },
    "Week 5: Tests and debugging": {
        "fr": {"name": "Semaine 5 : Tests et débogage", "description": "Ce que nous couvrons dans la semaine 5."},
        "ar": {"name": "الأسبوع 5: الاختبارات وتصحيح الأخطاء", "description": "ما نغطيه في الأسبوع 5."},
    },
    "Week 6: Deploy and operate": {
        "fr": {"name": "Semaine 6 : Déploiement et exploitation", "description": "Ce que nous couvrons dans la semaine 6."},
        "ar": {"name": "الأسبوع 6: النشر والتشغيل", "description": "ما نغطيه في الأسبوع 6."},
    },
}

@cli.command()
def seed_chapter_translations():
    """Populate extra_metadata.translations for all existing chapters."""
    learnhouse_config = get_learnhouse_config()
    engine = create_engine(
        learnhouse_config.database_config.sql_connection_string, echo=False, pool_pre_ping=True
    )
    db_session = Session(engine)

    statement = select(Chapter)
    chapters = db_session.exec(statement).all()

    updated = 0
    for chapter in chapters:
        translations = CHAPTER_TRANSLATIONS.get(chapter.name)
        if not translations:
            print(f"  ⏭️  '{chapter.name}' — no translation mapping found, skipping")
            continue

        meta = chapter.extra_metadata or {}
        existing = meta.get("translations", {})

        # Only add if not already present
        changed = False
        for locale in ("fr", "ar"):
            if locale not in existing:
                existing[locale] = translations[locale]
                changed = True

        if changed:
            meta["translations"] = existing
            chapter.extra_metadata = meta
            db_session.add(chapter)
            updated += 1
            print(f"  ✅ '{chapter.name}' — added fr + ar translations")
        else:
            print(f"  ⏭️  '{chapter.name}' — translations already exist, skipping")

    db_session.commit()
    db_session.close()
    print(f"\nDone. Updated {updated} chapters.")

@cli.command()
def install(
    short: Annotated[bool, typer.Option(help="Install with predefined values")] = False
):
    # Get the database session
    learnhouse_config = get_learnhouse_config()
    engine = create_engine(
        learnhouse_config.database_config.sql_connection_string, echo=False, pool_pre_ping=True  # type: ignore
    )
    SQLModel.metadata.create_all(engine)

    db_session = Session(engine)

    if short:
        # Install the default elements
        print("Installing default elements...")
        install_default_elements(db_session)
        print("Default elements installed ✅")

        # Create the Organization
        print("Creating default organization...")
        org = OrganizationCreate(
            name="Default Organization",
            description="Default Organization",
            slug="default",
            email="",
            logo_image="",
            thumbnail_image="",
            about="",
            label="",
        )
        install_create_organization(org, db_session)
        print("Default organization created ✅")

        # Create Organization User
        print("Creating default organization user...")
        # Use email from environment variable if provided, otherwise default to "admin@school.dev"
        email = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "admin@school.dev")
        # Require password from environment variable
        password = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_PASSWORD")
        if not password:
            print("❌ Error: LEARNHOUSE_INITIAL_ADMIN_PASSWORD environment variable is required")
            print("Please set LEARNHOUSE_INITIAL_ADMIN_PASSWORD environment variable before running installation.")
            raise typer.Exit(code=1)
        print("Using password from LEARNHOUSE_INITIAL_ADMIN_PASSWORD environment variable")
        if email != "admin@school.dev":
            print(f"Using email from LEARNHOUSE_INITIAL_ADMIN_EMAIL environment variable: {email}")
        user = UserCreate(
            username="admin", email=email, password=password
        )
        install_create_organization_user(user, "default", db_session)
        print("Default organization user created ✅")

        # Show the user how to login
        print("Installation completed ✅")
        print("")
        print("Login with the following credentials:")
        print("email: " + email)
        print("password: (the password you set in LEARNHOUSE_INITIAL_ADMIN_PASSWORD)")
        print("⚠️ Remember to change the password after logging in ⚠️")

    else:
        # Install the default elements
        print("Installing default elements...")
        install_default_elements(db_session)
        print("Default elements installed ✅")

        # Create the Organization
        print("Creating your organization...")
        orgname = typer.prompt("What's shall we call your organization?")
        slug = typer.prompt(
            "What's the slug for your organization? (e.g. school, acme)"
        )
        org = OrganizationCreate(
            name=orgname,
            description="Default Organization",
            slug=slug.lower(),
            email="",
            logo_image="",
            thumbnail_image="",
            about="",
            label="",
        )
        install_create_organization(org, db_session)
        print(orgname + " Organization created ✅")

        # Create Organization User
        print("Creating your organization user...")
        username = typer.prompt("What's the username for the user?")
        email = typer.prompt("What's the email for the user?")
        password = typer.prompt("What's the password for the user?", hide_input=True)
        user = UserCreate(username=username, email=email, password=password)
        install_create_organization_user(user, slug, db_session)
        print(username + " user created ✅")

        # Show the user how to login
        print("Installation completed ✅")
        print("")
        print("Login with the following credentials:")
        print("email: " + email)
        print("password: The password you entered")




@cli.command()
def main():
    cli()


if __name__ == "__main__":
    cli()
