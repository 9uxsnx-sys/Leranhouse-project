"""Creates the demo people: owner, teachers, moderators, students, groups, tokens."""

from __future__ import annotations

import hashlib
import secrets

from src.db.api_tokens import APIToken
from src.db.user_organizations import UserOrganization
from src.db.usergroup_resources import UserGroupResource
from src.db.usergroup_user import UserGroupUser
from src.db.usergroups import UserGroup
from src.db.users import User
from src.services.seed import copy as C
from src.services.seed.core import (
    OWNER_EMAIL,
    SeedContext,
    iso,
    new_uuid,
    user_content_dir,
)

ROLE_ADMIN = 1
ROLE_MAINTAINER = 2
ROLE_INSTRUCTOR = 3
ROLE_USER = 4


def _make_user(
    ctx: SeedContext,
    first: str,
    last: str,
    *,
    bio: str,
    created_days_ago: int,
    email: str | None = None,
) -> User:
    user_uuid = new_uuid("user")
    username = f"{first.lower()}.{last.lower().replace(' ', '')}{ctx.rng.randint(1, 99)}"
    avatar = ctx.avatar(user_content_dir(ctx.content_root, user_uuid) / "avatars")
    created = ctx.date_between(created_days_ago + 20, created_days_ago)
    user = User(
        username=username,
        first_name=first,
        last_name=last,
        email=email or f"{username}@example.com",
        avatar_image=avatar,
        bio=bio,
        details={},
        profile={},
        password=ctx.password_hash,
        user_uuid=user_uuid,
        email_verified=True,
        email_verified_at=iso(created),
        failed_login_attempts=0,
        is_superadmin=False,
        signup_method="email",
        creation_date=iso(created),
        update_date=iso(created),
    )
    ctx.session.add(user)
    return user


def _link(user: User, ctx: SeedContext, role_id: int) -> UserOrganization:
    return UserOrganization(
        user_id=int(user.id or 0),
        org_id=ctx.org_id,
        role_id=role_id,
        creation_date=user.creation_date,
        update_date=user.creation_date,
    )


def create_people(ctx: SeedContext) -> None:
    owner = _make_user(
        ctx,
        "Yacine",
        "Benali",
        bio="Founder of Koodook Academy. Designer for eleven years, teacher for four.",
        created_days_ago=420,
        email=OWNER_EMAIL,
    )
    ctx.session.add(owner)
    ctx.session.commit()
    ctx.session.refresh(owner)
    ctx.owner = owner

    teacher_names = [
        ("Meriem", "Haddad"),
        ("Anis", "Khelifi"),
        ("Lina", "Belkacem"),
        ("Sofiane", "Cherif"),
    ]
    for index, (first, last) in enumerate(teacher_names):
        teacher = _make_user(
            ctx,
            first,
            last,
            bio=C.BIOS[index],
            created_days_ago=380 - index * 12,
        )
        ctx.session.add(teacher)
        ctx.session.commit()
        ctx.session.refresh(teacher)
        ctx.teachers.append(teacher)

    moderator_names = [("Nour", "Ait Ali"), ("Rania", "Bensalem"), ("Hakim", "Lounis")]
    for index, (first, last) in enumerate(moderator_names):
        moderator = _make_user(
            ctx,
            first,
            last,
            bio=C.BIOS[index + 4],
            created_days_ago=300 - index * 10,
        )
        ctx.session.add(moderator)
        ctx.session.commit()
        ctx.session.refresh(moderator)
        ctx.moderators.append(moderator)

    used: set[str] = set()
    for index in range(150):
        first = C.FIRST_NAMES[index % len(C.FIRST_NAMES)]
        last = C.LAST_NAMES[(index * 7 + index // 3) % len(C.LAST_NAMES)]
        key = f"{first} {last}"
        if key in used:
            last = C.LAST_NAMES[(index * 11 + 5) % len(C.LAST_NAMES)]
            key = f"{first} {last}"
        if key in used:
            first = f"{first}{index}"
        used.add(key)
        bio = C.YOUNG_BIOS[index % len(C.YOUNG_BIOS)] or C.BIOS[index % len(C.BIOS)]
        student = _make_user(
            ctx,
            first,
            last,
            bio=bio,
            created_days_ago=max(7, 200 - (index % 180)),
        )
        ctx.session.add(student)
        ctx.session.commit()
        ctx.session.refresh(student)
        ctx.students.append(student)

    memberships = [_link(owner, ctx, ROLE_ADMIN)]
    memberships += [_link(t, ctx, ROLE_INSTRUCTOR) for t in ctx.teachers]
    memberships += [_link(m, ctx, ROLE_MAINTAINER) for m in ctx.moderators]
    memberships += [_link(s, ctx, ROLE_USER) for s in ctx.students]
    ctx.session.add_all(memberships)
    ctx.session.commit()

    _create_groups(ctx)
    _create_tokens(ctx)


def _create_groups(ctx: SeedContext) -> None:
    for name, description in C.GROUPS:
        group = UserGroup(
            name=name,
            description=description,
            org_id=ctx.org_id,
            usergroup_uuid=new_uuid("usergroup"),
            creation_date=iso(ctx.date_back(120)),
            update_date=iso(ctx.now),
        )
        ctx.session.add(group)
        ctx.session.commit()
        ctx.session.refresh(group)
        ctx.groups.append(group)

    everybody = ctx.students + ctx.teachers + ctx.moderators
    for group in ctx.groups:
        members = ctx.rng.sample(everybody, 10)
        ctx.session.add_all(
            [
                UserGroupUser(
                    usergroup_id=int(group.id or 0),
                    user_id=int(member.id or 0),
                    org_id=ctx.org_id,
                    creation_date=iso(ctx.date_back(100)),
                    update_date=iso(ctx.now),
                )
                for member in members
            ]
        )
    ctx.session.commit()


def attach_group_resources(ctx: SeedContext, resources: list[tuple[str, str]]) -> None:
    """Assign a few courses and podcasts to groups once they exist."""
    for index, (resource_uuid, _kind) in enumerate(resources):
        group = ctx.groups[index % len(ctx.groups)]
        ctx.session.add(
            UserGroupResource(
                usergroup_id=int(group.id or 0),
                resource_uuid=resource_uuid,
                org_id=ctx.org_id,
                creation_date=iso(ctx.date_back(90)),
                update_date=iso(ctx.now),
            )
        )
    ctx.session.commit()


def _create_tokens(ctx: SeedContext) -> None:
    for name, description in [
        ("Reporting script", "Read only token used by the monthly reporting script."),
        ("Website sync", "Pulls the course catalogue into the marketing site."),
    ]:
        raw = secrets.token_urlsafe(24)
        ctx.session.add(
            APIToken(
                name=name,
                description=description,
                rights=None,
                token_uuid=new_uuid("apitoken"),
                token_prefix=f"lh_{raw[:9]}",
                token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                org_id=ctx.org_id,
                created_by_user_id=int(ctx.owner.id or 0),
                creation_date=iso(ctx.date_back(60)),
                update_date=iso(ctx.now),
                is_active=True,
            )
        )
    ctx.session.commit()
