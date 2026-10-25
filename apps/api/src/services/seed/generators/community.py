"""Communities, discussions, replies, reactions and votes."""

from __future__ import annotations

from src.db.communities.communities import Community
from src.db.communities.discussion_comment_votes import DiscussionCommentVote
from src.db.communities.discussion_comments import DiscussionComment
from src.db.communities.discussion_reactions import DiscussionReaction
from src.db.communities.discussion_votes import DiscussionVote
from src.db.communities.discussions import Discussion
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir

REACTION_EMOJI = ["\U0001F44D", "\u2764\uFE0F", "\U0001F389", "\U0001F602"]
LABELS = ["general", "question", "idea", "announcement", "showcase"]


def create_communities(ctx: SeedContext) -> None:
    base = org_content_dir(ctx.content_root, ctx.org_uuid) / "communities"
    created_communities = []

    for index, (name, description) in enumerate(C.COMMUNITIES):
        created = ctx.date_between(160, 30)
        community_uuid = new_uuid("community")
        community_dir = base / community_uuid
        # The first community belongs to the flagship course, so the course
        # page gets a live feed and the "course" filter has something in it.
        linked_course = ctx.flagship if index == 0 else None
        if index == 0:
            # The flagship community is opened on camera and reuses the course artwork.
            thumbnail = ctx.named_image(
                community_dir / "thumbnails", "thumb", "coding/flagship course.jpg"
            )
            banner = ctx.named_image(
                community_dir / "banners", "banner", "banner.png"
            )
        else:
            thumbnail = ctx.image(
                community_dir / "thumbnails", "thumb", C.COMMUNITY_NICHES.get(name)
            )
            banner = ""
        community = Community(
            name=name,
            description=description,
            public=True,
            thumbnail_image=thumbnail,
            banner_image=banner,
            org_id=ctx.org_id,
            course_id=int(linked_course.id or 0) if linked_course else None,
            community_uuid=community_uuid,
            moderation_words=[],
            moderation_settings={},
            published=index < 16,
            creation_date=iso(created),
            update_date=iso(created),
        )
        ctx.session.add(community)
        ctx.session.commit()
        ctx.session.refresh(community)
        created_communities.append(community)

    ctx.communities = created_communities
    main = created_communities[0]

    for post in C.DISCUSSION_POSTS:
        _create_discussion(ctx, main, post, pinned=post[2] == "announcement")

    for community in created_communities[1:16]:
        for post in ctx.rng.sample(C.DISCUSSION_POSTS, 3):
            _create_discussion(ctx, community, post, pinned=False)

    ctx.session.commit()


def _create_discussion(
    ctx: SeedContext, community: Community, post: tuple, *, pinned: bool
) -> None:
    title, content, label = post
    author = ctx.rng.choice(ctx.students + ctx.moderators)
    created = ctx.date_between(120, 1)
    votes = ctx.rng.randint(0, 24)
    discussion = Discussion(
        title=title,
        content=content,
        label=label if label in LABELS else "general",
        emoji=ctx.rng.choice(["", "\U0001F4AC", "\u2753", "\U0001F4A1"]),
        community_id=int(community.id or 0),
        org_id=ctx.org_id,
        author_id=int(author.id or 0),
        discussion_uuid=new_uuid("discussion"),
        upvote_count=votes,
        edit_count=0,
        is_pinned=pinned,
        is_locked=False,
        creation_date=iso(created),
        update_date=iso(created),
    )
    ctx.session.add(discussion)
    ctx.session.commit()
    ctx.session.refresh(discussion)

    _add_votes(ctx, discussion, votes, created)
    _add_reactions(ctx, discussion, created)

    reply_count = ctx.rng.choices([0, 1, 2, 4, 6], weights=[20, 30, 25, 15, 10])[0]
    if community.name == C.COMMUNITIES[0][0]:
        reply_count = ctx.rng.choices([0, 1, 3, 6], weights=[10, 30, 40, 20])[0]

    for reply_index in range(reply_count):
        commenter = ctx.rng.choice(ctx.students + ctx.teachers)
        reply_at = created + (ctx.now - created) * (reply_index + 1) / (reply_count + 1)
        comment = DiscussionComment(
            content=ctx.rng.choice(C.DISCUSSION_REPLIES),
            discussion_id=int(discussion.id or 0),
            author_id=int(commenter.id or 0),
            comment_uuid=new_uuid("comment"),
            upvote_count=ctx.rng.randint(0, 6),
            creation_date=iso(reply_at),
            update_date=iso(reply_at),
        )
        ctx.session.add(comment)
        ctx.session.commit()
        ctx.session.refresh(comment)
        _add_comment_votes(ctx, comment, reply_at)


def _add_votes(ctx: SeedContext, discussion: Discussion, count: int, created) -> None:
    voters = ctx.rng.sample(ctx.students, min(count, 40))
    for voter in voters:
        ctx.session.add(
            DiscussionVote(
                discussion_id=int(discussion.id or 0),
                user_id=int(voter.id or 0),
                vote_uuid=new_uuid("discussionvote"),
                creation_date=iso(created),
            )
        )
    ctx.session.commit()


def _add_reactions(ctx: SeedContext, discussion: Discussion, created) -> None:
    reactors = ctx.rng.sample(ctx.students, ctx.rng.randint(0, 8))
    for reactor in reactors:
        ctx.session.add(
            DiscussionReaction(
                discussion_id=int(discussion.id or 0),
                user_id=int(reactor.id or 0),
                emoji=ctx.rng.choice(REACTION_EMOJI),
                reaction_uuid=new_uuid("reaction"),
                creation_date=iso(created),
            )
        )
    ctx.session.commit()


def _add_comment_votes(ctx: SeedContext, comment: DiscussionComment, created) -> None:
    voters = ctx.rng.sample(ctx.students, ctx.rng.randint(0, 5))
    for voter in voters:
        ctx.session.add(
            DiscussionCommentVote(
                comment_id=int(comment.id or 0),
                user_id=int(voter.id or 0),
                vote_uuid=new_uuid("commentvote"),
                creation_date=iso(created),
            )
        )
    ctx.session.commit()
