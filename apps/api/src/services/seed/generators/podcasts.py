"""Podcast shows, episodes and translations."""

from __future__ import annotations

from src.db.payments.enums import AccessTypeEnum
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcast_translations import PodcastTranslation
from src.db.podcasts.podcasts import Podcast
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir


def _podcast_meta(name: str, host: str) -> dict:
    """Return podcast extra_metadata based on the show's theme."""
    pool = {
        "The Pixel Hour": {
            "learnings": [
                "How design decisions are made behind the scenes",
                "The real story behind finished projects",
                "Why deadlines shift and how teams adapt",
                "Balancing creativity with practical constraints",
            ],
            "target_audience": {
                "for": ["Designers", "Design students", "Product people"],
                "not_for": ["Anyone looking for step-by-step tutorials"],
            },
            "requirements": ["Basic familiarity with design tools"],
        },
        "Designers Who Ship": {
            "learnings": [
                "How to finish and release design projects",
                "What makes a portfolio stand out",
                "Handling imperfect work in production",
                "Real post-launch lessons from working designers",
            ],
            "target_audience": {
                "for": ["Working designers", "Design students", "Portfolio builders"],
                "not_for": ["Complete beginners to design"],
            },
            "requirements": ["Some design experience"],
        },
        "Two Developers Arguing": {
            "learnings": [
                "Different approaches to software architecture",
                "How to evaluate technical trade-offs",
                "When to change your mind about a technical decision",
                "Common architecture pitfalls and how to spot them",
            ],
            "target_audience": {
                "for": ["Developers", "Tech leads", "Software architects"],
                "not_for": ["Non-technical listeners"],
            },
            "requirements": ["Professional programming experience"],
        },
        "The Freelance Files": {
            "learnings": [
                "How to handle difficult clients",
                "Setting rates and managing scope",
                "Dealing with late payments professionally",
                "Writing better client messages",
            ],
            "target_audience": {
                "for": ["Freelancers", "Solo practitioners", "Agency owners"],
                "not_for": ["Full-time employees not planning to freelance"],
            },
            "requirements": ["Some freelance or client work experience"],
        },
        "Data Without Drama": {
            "learnings": [
                "How to present data clearly to non-technical stakeholders",
                "Choosing the right chart for your data",
                "Common dashboard mistakes and fixes",
                "Turning raw numbers into actionable insights",
            ],
            "target_audience": {
                "for": ["Data analysts", "Product managers", "Anyone who presents data"],
                "not_for": ["Hardcore data scientists looking for advanced math"],
            },
            "requirements": ["Basic spreadsheet literacy"],
        },
    }
    return pool.get(
        name,
        {
            "learnings": [
                f"Insights from {host} and guests about {name.lower()}",
                "Practical tips you can apply right away",
                "Real stories from people working in the field",
                "Common mistakes and how to avoid them",
            ],
            "target_audience": {
                "for": ["Professionals in the field", "Students", "Curious learners"],
                "not_for": ["Absolute beginners"],
            },
            "requirements": ["No prior knowledge required"],
        },
    )

TRANSLATIONS = {
    "The Pixel Hour": {
        "fr": (
            "L heure du pixel",
            "Un invite, un projet, une heure. On parle des decisions derriere les ecrans.",
        ),
        "ar": (
            "ساعة البكسل",
            "ضيف واحد ومشروع واحد وساعة واحدة. نتحدث عن القرارات التي تقف خلف الشاشات.",
        ),
    },
    "Designers Who Ship": {
        "fr": (
            "Des designers qui livrent",
            "Des episodes courts sur les projets termines et ce qu ils ont appris.",
        ),
        "ar": (
            "مصممون ينجزون",
            "حلقات قصيرة عن مشاريع انتهت فعلا وما تعلمه اصحابها.",
        ),
    },
    "The Freelance Files": {
        "fr": (
            "Dossiers freelance",
            "Des histoires de clients, certaines bonnes, certaines douloureuses.",
        ),
        "ar": (
            "ملفات العمل الحر",
            "قصص عملاء، بعضها جيد وبعضها مؤلم، وكلها مفيدة.",
        ),
    },
}


def create_podcasts(ctx: SeedContext) -> None:
    base = org_content_dir(ctx.content_root, ctx.org_uuid) / "podcasts"
    shows: list[Podcast] = []

    for index, (name, description, host) in enumerate(C.PODCASTS):
        created = ctx.date_between(170, 25)
        podcast_uuid = new_uuid("podcast")
        podcast_dir = base / podcast_uuid
        if index == 0:
            # The flagship podcast gets hand-picked card cover and banner artwork.
            thumbnail = ctx.named_image(
                podcast_dir / "thumbnails", "thumb", "flagship podcats card cover.jpg"
            )
            banner = ctx.named_image(
                podcast_dir / "banners", "banner", "flagship podcats podcast banner.png"
            )
        else:
            thumbnail = ctx.image(podcast_dir / "thumbnails", "thumb")
            banner = ctx.image(podcast_dir / "banners", "banner")

        podcast = Podcast(
            name=name,
            description=description,
            about=f"Hosted by {host}. Recorded in a small room with too many cables and not enough coffee.",
            tags="design, learning, interviews",
            thumbnail_image=thumbnail,
            banner_image=banner,
            public=True,
            published=index < 16,
            org_id=ctx.org_id,
            podcast_uuid=podcast_uuid,
            seo={
                "title": name,
                "description": description[:150],
                "keywords": "design, podcast, learning",
                "robots_noindex": False,
                "robots_nofollow": False,
                "enable_jsonld": True,
            },
            extra_metadata=_podcast_meta(name, host),
            access_type=AccessTypeEnum.PUBLIC,
            price_amount=None,
            price_currency="DZD",
            source_locale="en",
            creation_date=iso(created),
            update_date=iso(created),
        )
        ctx.session.add(podcast)
        ctx.session.commit()
        ctx.session.refresh(podcast)
        shows.append(podcast)

    ctx.podcasts = shows

    main = shows[0]
    for order, (title, description) in enumerate(C.FLAGSHIP_EPISODES):
        _create_episode(ctx, main, title, description, order)

    for podcast in shows[1:16]:
        for order in range(2):
            title = (
                f"Episode {order + 1}: {ctx.rng.choice(['Notes from the studio', 'A short one about practice', 'What we got wrong this month', 'Questions from listeners'])}"
            )
            description = (
                "A short conversation recorded between meetings. Rough audio, honest answers."
                if order == 0
                else "Second episode of the season. We answer one question properly instead of five badly."
            )
            _create_episode(ctx, podcast, title, description, order)

    _create_translations(ctx, shows)


def _create_episode(
    ctx: SeedContext, podcast: Podcast, title: str, description: str, order: int
) -> None:
    episode_uuid = new_uuid("episode")
    created = ctx.date_between(140, 2)
    podcast_dir = (
        org_content_dir(ctx.content_root, ctx.org_uuid)
        / "podcasts"
        / podcast.podcast_uuid
        / "episodes"
        / episode_uuid
    )
    audio = ctx.assets.copy_audio(podcast_dir / "audio")
    thumbnail = ctx.image(podcast_dir / "thumbnails", f"ep{order + 1}")

    # Episode-specific learning objectives and key points for the flagship podcast
    is_flagship = podcast == ctx.podcasts[0]
    if is_flagship:
        objectives, kp = _flagship_episode_meta(order)
    else:
        objectives = [
            "Understand the core topic of this episode",
            "Identify key insights and actionable takeaways",
            "Apply the discussed concepts to real-world scenarios",
        ]
        kp = [
            {"title": "Opening", "items": ["Introduction to the topic", "Guest or host background"]},
            {"title": "Main Discussion", "items": ["Key argument or insight", "Real example or story"]},
            {"title": "Wrap Up", "items": ["Summary of key takeaways", "What to do next"]},
        ]

    ctx.session.add(
        PodcastEpisode(
            title=title,
            description=description,
            audio_file=audio,
            duration_seconds=ctx.rng.randint(900, 3600),
            episode_number=order + 1,
            thumbnail_image=thumbnail,
            published=True,
            order=order,
            podcast_id=int(podcast.id or 0),
            org_id=ctx.org_id,
            episode_uuid=episode_uuid,
            creation_date=iso(created),
            update_date=iso(created),
            extra_metadata={
                "learning_objectives": objectives,
                "key_points": kp,
            },
        )
    )
    ctx.session.commit()


def _flagship_episode_meta(order: int) -> tuple[list[str], list[dict]]:
    """Return episode-specific learning objectives and key points for The Pixel Hour."""
    pool = [
        (
            ["Understand why paper sketching speeds up early design decisions", "Recognise the warning signs of skipping discovery phases", "Apply quick sketching techniques to your own workflow"],
            [
                {"title": "The Paper Habit", "items": ["Why most designers skip paper and regret it later", "The cognitive difference between handwriting and digital tools", "How a three-week revision could have been avoided with five minutes of sketching"]},
                {"title": "Real-World Case Study", "items": ["A project timeline breakdown showing where paper would have helped", "Client communication lessons from the failed approach", "The exact moment the team realised their mistake"]},
                {"title": "Practical Takeaways", "items": ["Three low-effort ways to introduce paper into any workflow", "How to convince a remote team to try sketching together", "Tools and materials that actually work in a digital-first environment"]},
            ],
        ),
        (
            ["Master the 8 point grid system and its practical applications", "Identify when the grid helps and when it hinders", "Build spacing systems that scale across different screen sizes"],
            [
                {"title": "Grid Fundamentals", "items": ["Where the 8 point rule actually comes from (hint: not a designer)", "Why 8 works better than 4, 5, or 10 for most interfaces", "How to handle odd numbers and irregular spacing"]},
                {"title": "Typography and Alignment", "items": ["Setting up baseline grids that work with the 8 point system", "Handling line-height and margin calculations automatically", "What to do when your type scale breaks the grid"]},
                {"title": "When to Break the Rules", "items": ["The two specific cases where ignoring the grid improves the design", "How to trust your eye without abandoning the system entirely", "Real examples of beautiful designs that deliberately break the grid"]},
            ],
        ),
        (
            ["Develop a structured approach to live design critiques", "Learn to identify common pricing page usability issues", "Practice rapid redesign within tight time constraints"],
            [
                {"title": "The Live Critique Process", "items": ["How to approach a page you have never seen before systematically", "The eleven problems found in forty minutes ranked by severity", "Why most pricing pages fail at the hierarchy level before colour or copy"]},
                {"title": "Pricing Psychology", "items": ["How the order of pricing tiers influences decision-making", "The anchoring effect and why the middle option is rarely accidental", "Mobile-specific pricing layout mistakes that cost conversions"]},
                {"title": "Rapid Redesign Techniques", "items": ["Six problems fixed on the fly and the exact changes made", "Working under time pressure without sacrificing quality", "Tools and workflows for quick prototyping during critiques"]},
            ],
        ),
        (
            ["Understand why component naming is harder than it looks", "Learn a framework for creating team-wide naming conventions", "Recognise how different mental models affect design system adoption"],
            [
                {"title": "The Naming Experiment", "items": ["How the experiment was set up and why it matters", "The surprising results when two designers named the same components", "Categories where naming disagreements were most common"]},
                {"title": "Why Naming Matters", "items": ["How inconsistent naming slows down development handoffs", "The hidden cost of renaming components after they are built", "Real examples of naming conflicts from production design systems"]},
                {"title": "Building Naming Conventions That Stick", "items": ["A simple framework for naming any component consistently", "How to onboard new team members to an existing naming system", "When to prioritise consistency over expressiveness"]},
            ],
        ),
        (
            ["Understand the gap between designer intent and user perception", "Learn how to conduct quick user perception tests", "Recognise common assumptions that mislead design decisions"],
            [
                {"title": "The Perception Gap", "items": ["How the experiment was designed and why non-technical users were chosen", "The five reactions and what each one revealed", "Specific design elements that were consistently misinterpreted"]},
                {"title": "Common Assumptions That Mislead", "items": ["Why designers overestimate how much users notice details", "The features users completely missed versus the ones they fixated on", "How technical knowledge changes the way we see interfaces"]},
                {"title": "Closing the Gap", "items": ["Practical testing methods that fit into any timeline", "How to ask better questions during user research", "Building a habit of validating assumptions early and often"]},
            ],
        ),
        (
            ["Learn what makes a case study memorable versus forgettable", "Understand the difference between showing and telling in portfolios", "Build a simple structure for any project narrative"],
            [
                {"title": "The Screenshot Trap", "items": ["Why beautiful images without context hurt more than they help", "Real examples of portfolios that fail despite great visuals", "What hiring managers actually look for when reading case studies"]},
                {"title": "Storytelling Structure", "items": ["The three-part narrative that works for any project", "How much context is enough without being overwhelming", "Balancing process explanation with outcome demonstration"]},
                {"title": "Before and After", "items": ["A weak case study rewritten step by step into a strong one", "The specific phrases and framing choices that make a difference", "How to measure whether your case study is working"]},
            ],
        ),
        (
            ["Understand what hiring managers actually prioritise in junior portfolios", "Learn how to structure a portfolio that stands out", "Identify the most common mistakes junior applicants make"],
            [
                {"title": "What Hiring Managers Look For", "items": ["The specific qualities that make a junior portfolio stand out from sixty others", "Why side projects often matter more than coursework", "How personality and voice influence hiring decisions"]},
                {"title": "Common Junior Portfolio Mistakes", "items": ["The one thing almost every rejected portfolio is missing", "Why over-explaining is as bad as under-explaining", "How to handle projects that never shipped"]},
                {"title": "Actionable Advice", "items": ["How to structure a portfolio review session with peers", "What to include versus what to leave out", "The single most impactful change you can make this week"]},
            ],
        ),
        (
            ["Understand the unique challenges of bilingual Arabic-Latin layouts", "Learn practical solutions for baseline alignment issues", "Recognise why RTL support goes beyond mirroring the layout"],
            [
                {"title": "The Challenge of Bilingual Layouts", "items": ["Why Arabic and Latin scripts behave differently in the same layout", "Baseline alignment issues that most designers miss", "Line height inconsistencies and how to fix them"]},
                {"title": "Beyond Flipping the Layout", "items": ["Why simple RTL mirroring is rarely sufficient", "Typography hierarchy differences between Arabic and Latin", "Icon placement and visual weight considerations"]},
                {"title": "Practical Solutions", "items": ["Tools and techniques for testing bilingual layouts", "How to build a spacing system that handles both scripts", "Real examples of well-executed bilingual interfaces"]},
            ],
        ),
        (
            ["Understand Figma variables and their practical applications", "Learn about the limitations and edge cases of variables", "Build a variable-based design system that scales"],
            [
                {"title": "Variables in Practice", "items": ["How variables work in Figma beyond the marketing material", "Setting up modes for themes, breakpoints, and contexts", "Typography tokens and colour management with variables"]},
                {"title": "What Breaks and Why", "items": ["Edge cases that can trip up even experienced users", "Limitations of the current implementation", "Workarounds for features that are not yet supported"]},
                {"title": "Production Lessons", "items": ["Real feedback from daily variable usage since beta", "Team collaboration challenges with shared variable libraries", "Migration strategies for existing design systems"]},
            ],
        ),
        (
            ["Learn to recognise when a design is good enough to ship", "Understand the concept of diminishing returns in design", "Develop a framework for prioritising polish effort"],
            [
                {"title": "The Perfectionism Trap", "items": ["Why knowing when to stop is one of the most valuable design skills", "The difference between polish that matters and polish nobody notices", "Real examples of over-polished designs that shipped late and suffered"]},
                {"title": "A Framework for Good Enough", "items": ["How to evaluate whether a design is ready to ship", "The questions to ask before spending another hour on polish", "Balancing quality expectations with deadline reality"]},
                {"title": "Shipping Slightly Ugly", "items": ["Why the best designers are often the ones who know when to walk away", "How to handle your own discomfort with imperfect work", "The long-term benefits of shipping faster and iterating in public"]},
            ],
        ),
        (
            ["Understand what makes a dark theme feel premium versus cheap", "Learn colour theory principles for dark mode design", "Build a systematic approach to dark mode implementation"],
            [
                {"title": "Dark Mode Fundamentals", "items": ["Why pure black backgrounds make dark themes look cheap", "The colour theory behind effective dark mode palettes", "Contrast ratios and accessibility in dark themes"]},
                {"title": "Designing from the Ground Up", "items": ["Why converting from light mode produces inferior dark themes", "How to build semantic colour tokens that work in both modes", "Typography and iconography considerations for dark backgrounds"]},
                {"title": "Production Dark Mode", "items": ["Real examples of premium versus cheap dark themes", "Common implementation pitfalls and how to avoid them", "Testing dark mode across different devices and lighting conditions"]},
            ],
        ),
        (
            ["Learn to distinguish valuable feedback from distracting feedback", "Develop a filtering system for design critique", "Understand the psychology behind feedback preferences"],
            [
                {"title": "The Feedback Paradox", "items": ["Why exciting feedback often leads to wasted effort", "How boring-sounding critique can be the most valuable", "The psychological reasons we gravitate toward certain feedback types"]},
                {"title": "A Filtering System", "items": ["How to decide which feedback to act on and which to thank politely and ignore", "Questions to ask before acting on any piece of feedback", "Building a personal feedback triage process"]},
                {"title": "Practical Application", "items": ["Real examples of feedback that improved designs versus feedback that derailed them", "How to request the type of feedback you actually need", "Creating a team culture around effective critique"]},
            ],
        ),
        (
            ["Understand what makes a design-to-development handoff successful", "Learn preparation techniques that improve collaboration", "Build better communication practices between designers and developers"],
            [
                {"title": "The Successful Handoff", "items": ["What made this particular handoff work exceptionally well", "The preparation both sides did before the meeting", "How communication style affected the outcome"]},
                {"title": "Key Handoff Elements", "items": ["Component documentation that developers actually read", "Spacing specifications that eliminate guesswork", "Interaction prototypes that clarify complex behaviours"]},
                {"title": "The One Key Question", "items": ["The single most important question to ask before any handoff meeting", "How to follow up after handoff without being intrusive", "Building long-term collaboration habits between design and development"]},
            ],
        ),
        (
            ["Hear honest answers to common career and pricing questions", "Understand industry realities from experienced professionals", "Get practical advice for navigating design careers"],
            [
                {"title": "Money Questions Answered", "items": ["How much junior designers should charge and why", "Negotiation strategies that actually work", "When to raise your rates and how to prepare for the conversation"]},
                {"title": "Career Advice", "items": ["When is it time to leave a job and how to recognise the signs", "What skills matter most in 2026 and beyond", "How to build a career path without a traditional design education"]},
                {"title": "Industry Realities", "items": ["Honest answers about the current state of the design industry", "The future of design tools and what it means for practitioners", "Final advice from the season one guests and hosts"]},
            ],
        ),
    ]
    return pool[order]


def _create_translations(ctx: SeedContext, shows: list[Podcast]) -> None:
    for podcast in shows:
        payload = TRANSLATIONS.get(podcast.name)
        if not payload:
            continue
        for locale, (name, description) in payload.items():
            ctx.session.add(
                PodcastTranslation(
                    podcast_id=int(podcast.id or 0),
                    locale=locale,
                    name=name,
                    description=description,
                    about=podcast.about,
                    tags=podcast.tags,
                    seo=None,
                    state="published",
                    source_updated_at=podcast.update_date,
                    translated_by=None,
                    creation_date=iso(ctx.date_back(40)),
                    update_date=iso(ctx.now),
                )
            )
    ctx.session.commit()
