"""Communities, discussions, replies, reactions and votes."""

from __future__ import annotations

from src.db.communities.communities import Community
from src.db.communities.community_translations import CommunityTranslation
from src.db.communities.discussion_comment_votes import DiscussionCommentVote
from src.db.communities.discussion_comments import DiscussionComment
from src.db.communities.discussion_reactions import DiscussionReaction
from src.db.communities.discussion_votes import DiscussionVote
from src.db.communities.discussions import Discussion
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir

REACTION_EMOJI = ["\U0001F44D", "\u2764\uFE0F", "\U0001F389", "\U0001F602"]
LABELS = ["general", "question", "idea", "announcement", "showcase"]

# French and Arabic copy for every seeded community. Only the name and the
# description are admin-authored; discussions stay in the language the user
# wrote them in. Kept next to the generator so a fresh seed and the backfill
# script share one source of truth.
COMMUNITY_TRANSLATIONS: dict[str, dict[str, tuple[str, str]]] = {
    "Backend Engineering with Python": {
        "fr": (
            "Ingénierie Backend avec Python",
            "Posez vos questions sur le cours, publiez votre dépôt quand vous êtes bloqué et aidez la personne en dessous de vous. Une capture d'écran de l'erreur est bienvenue, le journal complet est encore mieux. Si vous avez résolu quelque chose la semaine dernière, écrivez-le pour que la personne suivante le trouve.",
        ),
        "ar": (
            "هندسة الواجهة الخلفية بلغة Python",
            "اسأل عن الدورة، وانشر مستودعك عندما تتعثر، وساعد الشخص الذي بعدك. لقطة شاشة للخطأ مرحّب بها، لكن السجل الكامل أفضل. وإذا حللت مشكلة الأسبوع الماضي فاكتبها ليجدها من يأتي بعدك.",
        ),
    },
    "Show Your Work": {
        "fr": (
            "Montrez votre travail",
            "Vous avez terminé quelque chose ? Petit ou grand, publiez-le ici. Les liens suffisent, les captures d'écran sont mieux. Dites-nous ce que cela fait, à qui c'est destiné et ce que vous changeriez avec une semaine de plus. Les notes honnêtes reçoivent plus de réponses que les images soignées.",
        ),
        "ar": (
            "اعرض عملك",
            "هل أنجزت شيئًا؟ صغيرًا كان أو كبيرًا، انشره هنا. الروابط مقبولة، ولقطات الشاشة أفضل. أخبرنا ماذا يفعل، ولمن هو موجّه، وما الذي ستغيّره لو كان لديك أسبوع إضافي. الملاحظات الصادقة تجلب ردودًا أكثر من الصور المصقولة.",
        ),
    },
    "Career Talk": {
        "fr": (
            "Parlons carrière",
            "Premier emploi, reconversion, entretiens, salaires. Les chiffres réels aident plus que les posts motivants. Si vous venez de signer une offre, partagez la fourchette et les questions posées. Si vous cherchez encore, dites à quelle étape vous bloquez.",
        ),
        "ar": (
            "حديث المسار المهني",
            "الوظيفة الأولى، تغيير المجال، المقابلات، الرواتب. الأرقام الحقيقية تفيد أكثر من المنشورات التحفيزية. إذا وقّعت عرضًا للتو، شارك نطاق الراتب والأسئلة التي طُرحت عليك. وإذا كنت ما زلت تبحث، قل في أي مرحلة تتعثر.",
        ),
    },
    "Freelance Lounge": {
        "fr": (
            "Espace freelance",
            "Clients, contrats et la facture que vous n'osez pas envoyer. Parlez des tarifs, du périmètre qui a grandi tout seul et de l'e-mail poli qui vous a pris trois brouillons. Personne ici ne vous dira de baisser votre prix pour garder la paix.",
        ),
        "ar": (
            "ركن العمل الحر",
            "العملاء والعقود والفاتورة التي تخشى إرسالها. تحدّث عن الأسعار، والنطاق الذي توسّع من تلقاء نفسه، والرسالة المهذبة التي احتاجت ثلاث مسودات. لن يقول لك أحد هنا أن تخفض سعرك حفاظًا على الهدوء.",
        ),
    },
    "Algeria Tech Scene": {
        "fr": (
            "Scène tech algérienne",
            "Meetups, recrutements et ce qui se passe réellement localement. Publiez les événements à Alger, Oran, Constantine et dans les plus petites villes aussi. Si votre entreprise recrute, précisez la stack et si le télétravail est possible depuis ici.",
        ),
        "ar": (
            "المشهد التقني في الجزائر",
            "اللقاءات والتوظيف وما يحدث فعليًا على المستوى المحلي. انشر الفعاليات في الجزائر العاصمة ووهران وقسنطينة والمدن الصغيرة أيضًا. وإذا كانت شركتك توظّف، فاذكر التقنيات وما إذا كان العمل عن بُعد ممكنًا من هنا.",
        ),
    },
    "Study Group": {
        "fr": (
            "Groupe d'étude",
            "Points d'étape hebdomadaires pour ceux qui suivent les cours ensemble. Dites ce que vous avez terminé, ce qui vous a bloqué et ce que vous prévoyez pour la semaine suivante. Les mises à jour courtes suffisent. Un mois de silence aussi, revenez quand vous pouvez.",
        ),
        "ar": (
            "مجموعة الدراسة",
            "متابعة أسبوعية لمن يدرسون الدورات معًا. قل ماذا أنهيت، وما الذي عطّلك، وخطتك للأسبوع القادم. التحديثات القصيرة تكفي. والصمت لشهر يكفي أيضًا، فعُد متى استطعت.",
        ),
    },
    "Front End Help": {
        "fr": (
            "Aide front-end",
            "React, CSS et le bug que vous fixez depuis deux heures. Collez le code, l'erreur et ce que vous avez déjà essayé. Quelqu'un le repère souvent en une minute, et c'est rarement ce que vous soupçonniez au départ.",
        ),
        "ar": (
            "مساعدة الواجهة الأمامية",
            "React وCSS والخطأ الذي تحدّق فيه منذ ساعتين. الصق الكود والخطأ وما جرّبته سابقًا. غالبًا سيلاحظه أحدهم في دقيقة، ونادرًا ما يكون ما شكّكت فيه أولًا.",
        ),
    },
    "Data Corner": {
        "fr": (
            "Coin data",
            "Pandas, SQL et des graphiques qui ne mentent pas. Partagez une requête dont vous êtes fier, demandez pourquoi un chiffre semble faux, ou publiez un graphique et laissez les autres le décortiquer. Les données d'exemple sont bienvenues, les captures de tableaux non.",
        ),
        "ar": (
            "ركن البيانات",
            "Pandas وSQL ورسوم بيانية لا تكذب. شارك استعلامًا تفتخر به، أو اسأل لماذا يبدو رقم ما خاطئًا، أو انشر رسمًا بيانيًا ودع الآخرين يفكّكونه. البيانات النموذجية مرحّب بها، أما لقطات الجداول فلا.",
        ),
    },
    "Product Photography": {
        "fr": (
            "Photographie produit",
            "Éclairages, retouches et retours honnêtes sur les photos produit. Publiez la photo brute à côté de la retouche finale pour que l'on voie ce qui a changé. Les photos au téléphone sont bienvenues ici, l'appareil compte moins que la lumière.",
        ),
        "ar": (
            "تصوير المنتجات",
            "الإضاءة والتعديلات والملاحظات الصادقة على صور المنتجات. انشر الصورة الأصلية بجانب النسخة النهائية لنرى ما تغيّر. صور الهاتف مرحّب بها هنا، فالكاميرا أقل أهمية من الإضاءة.",
        ),
    },
    "Motion Reel": {
        "fr": (
            "Bande de motion design",
            "Animations en cours et courbes d'accélération sur lesquelles vous débattez. Partagez le clip, sa durée et son objectif. Si quelque chose cloche, dites-le dans le post, cela évite à tous un round de suppositions polies.",
        ),
        "ar": (
            "أعمال الموشن",
            "أعمال تحريك قيد الإنجاز ومنحنيات الحركة التي تتجادلون حولها. شارك المقطع ومدته والغرض منه. وإذا كان هناك شيء غير مضبوط فاذكره في المنشور، فهذا يوفّر على الجميع جولة من التخمينات المهذبة.",
        ),
    },
    "Accessibility Crew": {
        "fr": (
            "Équipe accessibilité",
            "Audits, correctifs et les petits changements qui rendent un produit utilisable par tous. Dites ce que vous avez testé, comment et ce qui échoue encore. Le clavier, le contraste, l'ordre de focus et les libellés sont de bons points de départ.",
        ),
        "ar": (
            "فريق إمكانية الوصول",
            "عمليات التدقيق والإصلاحات والتغييرات الصغيرة التي تجعل المنتج صالحًا للجميع. اذكر ما اختبرته، وكيف اختبرته، وما لا يزال يفشل. لوحة المفاتيح والتباين وترتيب التركيز والتسميات نقاط بداية جيدة.",
        ),
    },
    "Copy Talk": {
        "fr": (
            "Parlons copywriting",
            "Textes d'interface, ton et le libellé de bouton que vous avez réécrit six fois. Partagez l'avant, l'après et la raison du changement. Les questions courtes reçoivent de bonnes réponses ici, les longs coups de gueule en reçoivent de meilleures.",
        ),
        "ar": (
            "حديث الكتابة",
            "نصوص الواجهة والنبرة وتسمية الزر التي أعدت كتابتها ست مرات. شارك ما قبل وما بعد وسبب التغيير. الأسئلة القصيرة تجد هنا إجابات جيدة، والمنشورات الطويلة تجد إجابات أفضل.",
        ),
    },
    "Job Board": {
        "fr": (
            "Offres d'emploi",
            "Des offres publiées par des membres de cette communauté. Indiquez la fourchette de salaire, sinon l'offre est supprimée. Précisez si le poste est en télétravail, hybride ou sur site, et nommez la ville. Les recruteurs sont bienvenus tant qu'ils suivent les mêmes règles.",
        ),
        "ar": (
            "لوحة الوظائف",
            "وظائف شاغرة من أعضاء هذا المجتمع. أدرج نطاق الراتب وإلا سيُحذف المنشور. بيّن ما إذا كانت الوظيفة عن بُعد أو هجينة أو في المكتب، واذكر المدينة. المسؤولون عن التوظيف مرحّب بهم ما داموا يلتزمون بالقواعد نفسها.",
        ),
    },
    "Course Feedback": {
        "fr": (
            "Retour sur les cours",
            "Ce qui est confus, ce qui va trop vite, ce qu'il faudrait ajouter. Indiquez le numéro de leçon et la minute si possible. Les critiques horodatées sont corrigées, les critiques générales sont lues une fois puis oubliées.",
        ),
        "ar": (
            "ملاحظات على الدورة",
            "ما هو غامض، وما هو سريع جدًا، وما ينبغي إضافته. اذكر رقم الدرس والدقيقة إن أمكن. الملاحظات المحددة بوقت تُصحّح، أما الملاحظات العامة فتُقرأ مرة وتُنسى.",
        ),
    },
    "Off Topic": {
        "fr": (
            "Hors sujet",
            "Tout ce qui ne rentre pas dans les autres salons. Restez bienveillants. Les mauvaises blagues, les bons livres, le clavier que vous regrettez d'avoir acheté et le café avec un wifi qui marche ont leur place ici, tant que personne ne vend rien.",
        ),
        "ar": (
            "خارج الموضوع",
            "كل ما لا يناسب الأقسام الأخرى. ابقَ ودودًا. النكات السيئة والكتب الجيدة ولوحة المفاتيح التي تندم على شرائها والمقهى ذو الواي فاي العامل كلها تنتمي هنا، بشرط ألا يبيع أحد شيئًا.",
        ),
    },
    "Announcements": {
        "fr": (
            "Annonces",
            "Mises à jour officielles sur les cours, les sessions en direct et la plateforme. Seuls les modérateurs publient ici, activez donc les notifications si vous ne voulez pas manquer un changement de date. Les questions sur une annonce vont dans le fil en dessous.",
        ),
        "ar": (
            "إعلانات",
            "تحديثات رسمية حول الدورات والجلسات المباشرة والمنصة. المشرفون فقط ينشرون هنا، لذا فعّل الإشعارات إن كنت لا تريد تفويت تغيير موعد. أسئلة الإعلان تُطرح في الموضوع أدناه.",
        ),
    },
    "Mentors Room": {
        "fr": (
            "Salle des mentors",
            "Communauté provisoire pour le pilote de mentorat. Nous décidons encore comment fonctionne le jumelage, utilisez donc cet espace pour dire ce que vous attendriez d'un mentor et combien de temps vous pouvez réalistement donner comme mentor.",
        ),
        "ar": (
            "غرفة المرشدين",
            "مجتمع مؤقت لتجربة الإرشاد. ما زلنا نحدّد كيفية عمل الاقتران، فاستخدم هذه المساحة لتقول ما تريده من المرشد، وكم من الوقت يمكنك فعليًا تقديمه كمرشد.",
        ),
    },
    "Beta Testers": {
        "fr": (
            "Testeurs bêta",
            "Communauté provisoire pour ceux qui testent les nouvelles fonctionnalités avant leur sortie. Signalez ce qui a cassé, ce qui vous a dérouté et ce qui semblait lent. Indiquez votre navigateur et votre appareil, cela nous évite un round de questions.",
        ),
        "ar": (
            "مختبِرو النسخة التجريبية",
            "مجتمع مؤقت لمن يختبرون الميزات الجديدة قبل إصدارها. أبلغ عمّا تعطّل، وما أربكك، وما بدا بطيئًا. أدرج متصفحك وجهازك، فهذا يوفّر علينا جولة من الأسئلة.",
        ),
    },
}


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

        # fr/ar copy of the two admin-authored fields.
        for locale, (translated_name, translated_description) in (
            COMMUNITY_TRANSLATIONS.get(name, {}) or {}
        ).items():
            ctx.session.add(
                CommunityTranslation(
                    community_id=int(community.id or 0),
                    locale=locale,
                    name=translated_name,
                    description=translated_description,
                    state="published",
                    source_updated_at=iso(created),
                    translated_by=None,
                    creation_date=iso(created),
                    update_date=iso(created),
                )
            )
        ctx.session.commit()

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
