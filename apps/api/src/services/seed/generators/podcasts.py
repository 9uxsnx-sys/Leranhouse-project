"""Podcast shows, episodes and translations."""

from __future__ import annotations

import re

from src.db.payments.enums import AccessTypeEnum
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcast_translations import PodcastEpisodeTranslation, PodcastTranslation
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
            "L'heure du pixel",
            "Un invité, un projet, une heure. Nous parlons des décisions derrière les écrans, pas des captures d'écran. "
            "Attendez-vous à de longs silences, des interruptions et au moins une histoire de délai repoussé deux fois.",
        ),
        "ar": (
            "ساعة البكسل",
            "ضيف واحد، مشروع واحد، ساعة واحدة. نتحدث عن القرارات التي تقف خلف الشاشات، لا عن لقطات الشاشة. "
            "في كل حلقة نجلس مع مصمم أو مطور أو مدير منتج ونفتح مشروعًا حقيقيًا من الداخل: من أول فكرة على الورق إلى آخر تفصيل قبل الإطلاق. "
            "توقّع فترات صمت طويلة، ومقاطعات، وأسئلة لا تظهر في دراسات الحالة المصقولة، وقصة واحدة على الأقل عن موعد تأجل مرتين ثم تغيّر كل شيء.",
        ),
    },
    "Designers Who Ship": {
        "fr": (
            "Des designers qui livrent",
            "Des épisodes courts sur l'art de finir les choses. Les invités apportent un projet réellement livré, "
            "y compris les parties encore imparfaites. Pas de discours sur le portfolio, pas d'études de cas parfaites, "
            "juste du travail fini et ce qu'il a coûté.",
        ),
        "ar": (
            "مصممون ينجزون",
            "حلقات قصيرة عن إنجاز الأشياء. يأتي الضيوف بمشروع أطلقوه فعلاً، بما في ذلك الأجزاء التي ما زالت غير مصقولة والعيوب التي تعايشوا معها. "
            "لا حديث عن ملفات الأعمال المثالية ولا دراسات حالة مرتبة، فقط عمل منجز وما كلف من وقت ومال وقرارات صعبة. "
            "نتوقف عند اللحظة التي قرروا فيها أن النسخة الحالية جاهزة، وكيف تعاملوا مع الضغط بعد الإطلاق.",
        ),
    },
    "The Freelance Files": {
        "fr": (
            "Dossiers freelance",
            "Des histoires de clients, certaines bonnes, certaines douloureuses, toutes utiles. Tarifs, périmètre, "
            "paiements en retard et le message que vous auriez dû envoyer une semaine plus tôt. "
            "Les noms sont changés, pas les chiffres.",
        ),
        "ar": (
            "ملفات العمل الحر",
            "قصص عملاء، بعضها جيد وبعضها مؤلم، وكلها مفيدة. نتحدث عن الأسعار ونطاق العمل والتأخر في الدفع والرسالة التي كان يجب أن ترسلها قبل أسبوع. "
            "كل حلقة تفتح ملفًا حقيقيًا من العمل الحر: كيف بدأ المشروع، وأين اختل الاتفاق، وماذا كان الطرفان يفكران فيه دون أن يقوله أحد. "
            "الأسماء مغيّرة والأرقام لا، حتى تتعلم من التجربة كما حدثت.",
        ),
    },
    "Two Developers Arguing": {
        "fr": (
            "Deux devs qui se disputent",
            "Deux amis aux opinions différentes sur l'architecture. En général, l'un des deux a tort. "
            "Chaque épisode commence par une vraie décision et se termine par l'un d'eux qui change d'avis, ou fait semblant.",
        ),
        "ar": (
            "مطوران يتجادلان",
            "صديقان بآراء مختلفة حول البنية المعمارية. عادةً يكون أحدهما مخطئًا، والمشكلة أن أيهما ليس واضحًا دائمًا. "
            "كل حلقة تبدأ بقرار حقيقي — اختيار قاعدة بيانات، تقسيم خدمة، أو إعادة كتابة جزء من النظام — وتنتهي بتغيير أحدهما رأيه، أو بتظاهره بذلك. "
            "بين الطرفين نسمع الحجج والمقايضات والأشياء التي لا تظهر في الوثائق.",
        ),
    },
    "Data Without Drama": {
        "fr": (
            "Données sans drame",
            "Parlons chiffres, tableaux de bord et des questions qui se cachent derrière, sans détour. "
            "Nous ouvrons un vrai jeu de données, nous nous disputons sur le graphique et nous terminons "
            "avec quelque chose que vous pourriez réellement envoyer à un manager.",
        ),
        "ar": (
            "بيانات بلا دراما",
            "حديث صريح عن الأرقام ولوحات البيانات والأسئلة التي تقف خلفها. نفتح مجموعة بيانات حقيقية، ونتجادل حول الرسم البياني الأفضل، وننتهي بشيء يمكنك إرساله فعلاً إلى مدير. "
            "الحلقات تشرح كيف تختار المقياس المناسب، وكيف تتجنب لوحة تلمع ولا تقول شيئًا، وكيف تتحول الأرقام الخام إلى قرار واضح دون مبالغة أو تهويل.",
        ),
    },
    "Screens and Coffee": {
        "fr": (
            "Écrans et café",
            "Vingt minutes de discussion sur l'interface qui nous a agacés cette semaine. "
            "Sans préparation, sans invités, juste deux personnes qui décrivent un formulaire qui aurait dû être plus simple.",
        ),
        "ar": (
            "شاشات وقهوة",
            "عشرون دقيقة من الحديث عن أي واجهة أزعجتنا هذا الأسبوع. بلا تحضير وبلا ضيوف، فقط شخصان يصفان نموذجًا كان يجب أن يكون أبسط، أو زرًا في المكان الخطأ، أو تدفقًا يحتاج إلى خمس خطوات ليفعل ما يمكن فعله في خطوة. "
            "نفتح الشاشة، ننظر إلى التفاصيل الصغيرة، ونتفق غالبًا على أن الحل كان أقرب مما بدا.",
        ),
    },
    "Studio Visits": {
        "fr": (
            "Visites de studios",
            "Enregistré dans de petits studios. Bureaux, outils et comment le travail se fabrique. "
            "Nous posons des questions sur le loyer, l'équipement et les systèmes ennuyeux qui font tourner un studio de deux personnes.",
        ),
        "ar": (
            "زيارات الاستوديوهات",
            "مسجّل داخل استوديوهات صغيرة. المكاتب والأدوات وكيف يُصنع العمل يومًا بيوم. نسأل عن الإيجار والمعدات والأنظمة المملة التي تُبقي استوديو من شخصين يعمل، "
            "وعن الطريقة التي يتوزع بها الوقت بين العمل المدفوع والتعلم والتجارب الجانبية. جولات هادئة في أماكن لا تُرى عادة، بصوت الغرفة كما هو.",
        ),
    },
    "Learn in Public": {
        "fr": (
            "Apprendre en public",
            "Des gens partagent ce qu'ils apprennent en ce moment, erreurs comprises. "
            "Les invités ne sont pas encore des experts, et c'est tout l'intérêt. "
            "Vous entendez la confusion avant l'explication bien ordonnée.",
        ),
        "ar": (
            "التعلم علنا",
            "أشخاص يشاركون ما يتعلمونه الآن، بما في ذلك الأخطاء. الضيوف ليسوا خبراء بعد، وهذا هو المقصد. تسمع الحيرة قبل الشرح المرتب، والمحاولات الأولى قبل أن تصبح إتقانًا. "
            "نتحدث عن كيف يختارون ما يتعلمونه، وكيف يوثقونه، وكيف يتعاملون مع الشعور بأنهم لا يعرفون ما يكفي، وكيف يستمرون رغم ذلك.",
        ),
    },
    "The Product Lens": {
        "fr": (
            "La loupe produit",
            "Des chefs de produit et des designers parlent de la même décision de deux côtés. "
            "Un épisode, une fonctionnalité, deux versions de la raison pour laquelle elle a été livrée ainsi.",
        ),
        "ar": (
            "عدسة المنتج",
            "مديرو منتجات ومصممون يتحدثون عن القرار نفسه من جهتين. حلقة واحدة، ميزة واحدة، وروايتان لسبب إطلاقها بالشكل الذي أُطلقت به. "
            "نسمع كيف نظر فريق المنتج إلى المشكلة، وكيف فهمها فريق التصميم، وأين اختلفت الأولويات قبل أن يصل العمل إلى المستخدمين. "
            "الحلقات تفتح المسافة بين الخطة والواقع الذي فرضته البيانات والمواعيد.",
        ),
    },
    "Type Talk": {
        "fr": (
            "Paroles de typographie",
            "Polices, espacement et les détails que personne ne remarque avant qu'ils ne soient faux. "
            "Nous examinons de vrais écrans et expliquons ce que fait la typographie, et comment un petit changement le corrige.",
        ),
        "ar": (
            "حديث الخطوط",
            "الخطوط والمسافات والتفاصيل التي لا يلاحظها أحد حتى تخطئ. ننظر إلى شاشات حقيقية ونشرح ما يفعله الخط، وكيف يصلحه تغيير صغير في الحجم أو الوزن أو المسافة بين السطور. "
            "نتحدث أيضًا عن اختيار الخط، وعن القراءة على الشاشات الصغيرة، وعن الأخطاء التي تتكرر في كل مكان دون أن يعرف مصدرها أحد.",
        ),
    },
    "Motion Sickness": {
        "fr": (
            "Vertige du mouvement",
            "Critique d'animation et la transition que tout le monde surutilise. "
            "Nous regardons un clip, le ralentissons et débattons de l'accélération. "
            "Parfois la réponse est de supprimer l'animation entièrement.",
        ),
        "ar": (
            "دوار الحركة",
            "نقد للحركة والانتقال الذي يفرط الجميع في استخدامه. نشاهد مقطعًا، نبطئه، ونتجادل حول التسهيل والمدة والغرض الحقيقي من الحركة. "
            "أحيانًا يكون الحل حذف الحركة بالكامل، وأحيانًا تصبح أفضل عندما تقصر أو تهدأ. "
            "نمر على أمثلة من واجهات حقيقية ونشرح متى تخدم الحركة المعنى ومتى تصبح مجرد زينة تبطئ المستخدم.",
        ),
    },
    "Behind the Build": {
        "fr": (
            "Derrière la construction",
            "Comment une fonctionnalité passe du croquis à la production. "
            "Développeurs et designers parcourent un ticket, y compris les estimations qui étaient fausses "
            "et la réunion qui aurait dû être un message.",
        ),
        "ar": (
            "خلف البناء",
            "كيف تنتقل ميزة من الرسم إلى الإنتاج. مطورون ومصممون يستعرضون تذكرة واحدة، بما في ذلك التقديرات الخاطئة والاجتماع الذي كان يجب أن يكون رسالة. "
            "نتبع الطريق كاملًا: كيف وُلدت الفكرة، وكيف تغيرت بعد النقاش، وأين ظهرت الأعطال، وما الذي اكتشفه الفريق بعد الإطلاق. "
            "حلقات عن العمل الحقيقي بعيدًا عن العروض التقديمية.",
        ),
    },
    "Career Switch": {
        "fr": (
            "Reconversion",
            "Des gens qui ont changé de métier après trente ans. Comment ils l'ont fait et ce que ça leur a coûté. "
            "Des chiffres honnêtes sur les baisses de salaire, les heures d'étude et la conversation en famille avant le premier cours.",
        ),
        "ar": (
            "تغيير المسار",
            "أشخاص غيّروا مجالهم بعد الثلاثين. كيف فعلوا ذلك وما كلفهم على المستوى العملي والشخصي. أرقام صادقة عن انخفاض الرواتب، وساعات الدراسة بعد العمل، "
            "والمحادثة العائلية قبل الدورة الأولى، والشك الذي رافقهم في منتصف الطريق. الحلقات لا تبيع نجاحًا سريعًا، بل تشرح كيف بُني التحول خطوة بخطوة، وما الذي كانوا سيغيّرونه لو عادوا للبداية.",
        ),
    },
    "Notes from Class": {
        "fr": (
            "Notes de cours",
            "De courts enregistrements de sessions en direct et des questions qui ont émergé. "
            "Sans montage, vous entendez donc les digressions et les moments où la salle se tait "
            "et où quelqu'un pose la question utile.",
        ),
        "ar": (
            "ملاحظات من الصف",
            "تسجيلات قصيرة من الجلسات المباشرة والأسئلة التي ظهرت أثناءها. بلا مونتاج، فتسمع الاستطرادات واللحظات التي تصمت فيها القاعة ويسأل أحدهم السؤال المفيد. "
            "نترك التسجيل كما هو لأنه يحفظ السياق: كيف وصل السؤال، وكيف تغيرت الإجابة أثناء الشرح، وما الذي فهمه الحاضرون فعلًا بعد أن انتهى الدرس.",
        ),
    },
    "The Weekly Standup": {
        "fr": (
            "Le point hebdomadaire",
            "Cinq minutes sur ce qui s'est passé sur la plateforme cette semaine. "
            "Nouveaux cours, bugs corrigés et une chose apprise d'un message de support. "
            "Enregistré le vendredi, publié avant le déjeuner.",
        ),
        "ar": (
            "الاجتماع الأسبوعي",
            "خمس دقائق عمّا حدث على المنصة هذا الأسبوع. دورات جديدة، وأخطاء مصلحة، وشيء واحد تعلمناه من رسالة دعم وصلت في وقتها. يُسجَّل يوم الجمعة ويُنشر قبل الغداء، "
            "بلا مونتاج ولا مقدمات طويلة. متابعة سريعة لما يتغير فعليًا في المنصة، ولماذا تغيّر، وما الذي سيأتي الأسبوع القادم.",
        ),
    },
    "Field Recordings": {
        "fr": (
            "Enregistrements terrain",
            "Des interviews de meetups, salles bruyantes comprises. Mauvais son, bonnes conversations. "
            "Nous apportons un seul microphone et demandons aux gens sur quoi ils travaillent en ce moment.",
        ),
        "ar": (
            "تسجيلات ميدانية",
            "مقابلات من لقاءات وغرف صاخبة. صوت سيئ ومحادثات جيدة. نحمل ميكروفونًا واحدًا ونسأل الناس عمّا يعملون عليه الآن، وما الذي يشغلهم في مشاريعهم، وما الذي تعلموه مؤخرًا. "
            "لا استوديو ولا إضاءة ولا إجابات مرتبة مسبقًا، فقط لقطات من الواقع كما تُسمع في الممرات وبين الجلسات.",
        ),
    },
    "Season Two Trailer": {
        "fr": (
            "Bande-annonce saison 2",
            "Flux provisoire pour la prochaine saison. Deux minutes d'extraits et une idée approximative du calendrier, "
            "conservé ici pendant que les épisodes sont encore en montage et que les noms ne sont pas définitifs.",
        ),
        "ar": (
            "إعلان الموسم الثاني",
            "خلاصة مسودة للموسم القادم. دقيقتان من المقاطع وفكرة تقريبية عن الجدول، تُحفظ هنا بينما الحلقات ما زالت تُحرر والأسماء غير نهائية. "
            "هذه ليست الحلقات النهائية، بل النسخ الأولى التي نستخدمها لتجربة الإيقاع والمقدمة والترتيب. "
            "تُترك هنا مؤقتًا لمن يريد متابعة كيف يتشكل الموسم قبل أن يصل إلى المستمعين.",
        ),
    },
    "Test Feed": {
        "fr": (
            "Flux de test",
            "Flux provisoire utilisé pendant l'installation du studio. Extraits courts, niveaux incorrects "
            "et un enregistrement d'une porte qui se ferme. Ignorez-le sauf si le processus vous intrigue.",
        ),
        "ar": (
            "تغذية اختبارية",
            "خلاصة مسودة استُخدمت أثناء تجهيز الاستوديو. مقاطع قصيرة ومستويات خاطئة وتسجيل لصوت باب يُغلق، تُركت هنا بالخطأ ثم صارت مرجعًا لنا. "
            "تجاهلها إلا إذا كان فضولك يدفعك لمعرفة كيف تبدو التجارب الأولى قبل النشر. لا نية لجعلها حلقة حقيقية، لكنها تذكّرنا بأن كل شيء يبدأ غير مرتب.",
        ),
    },
}


# ── Podcast-level copy ────────────────────────────────────────────────────────
# `about` is generated from the host name, so a template is enough — except for
# the flagship, which gets a long multi-paragraph introduction like the flagship
# course page.
PODCAST_ABOUT_TEMPLATE = {
    "en": (
        "Hosted by {host}. Recorded in a small room with too many cables "
        "and not enough coffee."
    ),
    "fr": (
        "Présenté par {host}. Enregistré dans une petite pièce avec trop de câbles "
        "et pas assez de café."
    ),
    "ar": (
        "يقدّمه {host}. سُجّل في غرفة صغيرة فيها كابلات أكثر مما ينبغي "
        "وقهوة أقل مما ينبغي."
    ),
}

PODCAST_ABOUT_OVERRIDES = {
    "The Pixel Hour": {
        "en": (
            "I started The Pixel Hour because I was tired of design conversations that began and ended with screenshots. "
            "The work we do happens long before anything is polished: in the argument about scope, the sketch nobody keeps, "
            "the third version of a flow that finally makes sense. So this show is one guest, one real project, one hour, "
            "and a microphone in a small room that is always slightly too warm. We talk about what was decided, what was "
            "avoided, and what it cost.\n\n"
            "Each episode follows the same shape. We begin with the project as it was handed to the guest — brief, deadline, "
            "constraints, the parts that were already broken. Then we walk through the decisions in order: what they tried, "
            "what they abandoned, where the timeline moved and why. The last twenty minutes are for the things that did not "
            "fit the story: the meeting that should have been a message, the client who changed their mind, the feature that "
            "shipped quietly and never got credit. Nothing is scripted, and I do not edit out the pauses.\n\n"
            "This is not a tutorial show. There are no step-by-step recreations and no perfect case studies. It is for "
            "designers, developers and product people who already do the work and want to hear how other people do it — "
            "including the messy parts they would not put in a portfolio. If you are looking for software walkthroughs or a "
            "course, this will frustrate you. If you have ever shipped something and still wondered whether the process was "
            "right, you are the audience.\n\n"
            "We record on one dynamic microphone and a lot of patience. Some episodes have traffic outside, a chair that "
            "creaks, and a guest who arrives late because of a client call. I keep those sounds in. The only things I remove "
            "are the confidential details: names of clients, numbers that belong to someone else, anything that could get a "
            "guest in trouble. Everything else stays as it happened, because a show about honest process cannot be heavily "
            "produced.\n\n"
            "By the end of an episode you should have one idea you can try on Monday and one question you can ask your own "
            "team. Not a framework, not a system — one concrete change in how you approach the next project. The community "
            "is open to listeners between episodes, and the best conversations tend to start there: someone describes their "
            "version of the problem, someone else has already lived through it. That is the whole point of the hour."
        ),
        "fr": (
            "J'ai lancé L'heure du pixel parce que j'en avais assez des conversations sur le design qui commencent et "
            "finissent par des captures d'écran. Le vrai travail se fait bien avant que quoi que ce soit soit poli : dans la "
            "discussion sur le périmètre, le croquis que personne ne garde, la troisième version d'un parcours qui finit par "
            "avoir du sens. Ici, c'est un invité, un projet réel, une heure, et un micro dans une petite pièce toujours un "
            "peu trop chaude. Nous parlons de ce qui a été décidé, de ce qui a été évité, et de ce que cela a coûté.\n\n"
            "Chaque épisode suit la même forme. On part du projet tel qu'il a été confié à l'invité — brief, délai, "
            "contraintes, les parties déjà cassées. Puis on reprend les décisions dans l'ordre : ce qu'il a essayé, ce qu'il "
            "a abandonné, où le planning a bougé et pourquoi. Les vingt dernières minutes sont pour ce qui n'entrait pas dans "
            "l'histoire : la réunion qui aurait dû être un message, le client qui a changé d'avis, la fonctionnalité livrée "
            "discrètement sans que personne ne la remarque. Rien n'est écrit à l'avance, et je ne coupe pas les silences.\n\n"
            "Ce n'est pas une émission de tutoriels. Il n'y a pas de reconstitutions pas à pas ni d'études de cas parfaites. "
            "C'est pour les designers, les développeurs et les profils produit qui font déjà le travail et qui veulent "
            "entendre comment d'autres le font — y compris les parties désordonnées qu'ils ne mettraient pas dans un "
            "portfolio. Si vous cherchez des démonstrations d'outils ou une formation, cette émission va vous frustrer. Si "
            "vous avez déjà livré quelque chose en vous demandant si la méthode était juste, vous êtes le public.\n\n"
            "On enregistre avec un seul micro dynamique et beaucoup de patience. Certains épisodes ont la circulation dehors, "
            "une chaise qui grince, et un invité en retard à cause d'un appel client. Je garde ces sons. Je retire seulement "
            "les détails confidentiels : noms de clients, chiffres qui appartiennent à quelqu'un d'autre, tout ce qui "
            "pourrait mettre un invité en difficulté. Le reste reste tel quel, parce qu'une émission sur le processus "
            "honnête ne peut pas être trop produite.\n\n"
            "À la fin d'un épisode, vous devriez avoir une idée à essayer dès lundi et une question à poser à votre propre "
            "équipe. Pas un cadre, pas un système — un changement concret dans votre façon d'aborder le prochain projet. La "
            "communauté reste ouverte entre les épisodes, et les meilleures conversations commencent souvent là : quelqu'un "
            "décrit sa version du problème, quelqu'un d'autre l'a déjà vécu. C'est tout le sens de cette heure."
        ),
        "ar": (
            "أطلقت «ساعة البكسل» لأنني تعبت من أحاديث التصميم التي تبدأ وتنتهي بلقطات الشاشة. العمل الحقيقي يحدث قبل أن "
            "يصبح أي شيء مصقولًا: في الجدل حول النطاق، والرسم الذي لا يحتفظ به أحد، والنسخة الثالثة من مسار يصبح منطقيًا "
            "أخيرًا. هنا: ضيف واحد، ومشروع حقيقي واحد، وساعة واحدة، وميكروفون في غرفة صغيرة دافئة أكثر مما ينبغي. نتحدث "
            "عمّا تقرر، وعمّا تم تجنبه، وما كلف ذلك.\n\n"
            "كل حلقة تتبع الشكل نفسه. نبدأ بالمشروع كما وصل إلى الضيف — الموجز والموعد والقيود والأجزاء المكسورة مسبقًا. "
            "ثم نستعرض القرارات بالترتيب: ما جرّبه، وما تخلى عنه، وأين تحرك الجدول ولماذا. العشرون دقيقة الأخيرة لما لم "
            "يدخل في القصة: الاجتماع الذي كان يجب أن يكون رسالة، والعميل الذي غيّر رأيه، والميزة التي أُطلقت بهدوء ولم "
            "يلاحظها أحد. لا شيء مكتوب مسبقًا، ولا أحذف لحظات الصمت.\n\n"
            "هذا ليس برنامجًا تعليميًا. لا يوجد إعادة بناء خطوة بخطوة ولا دراسات حالة مثالية. إنه للمصممين والمطورين "
            "والعاملين على المنتجات الذين يمارسون العمل فعلًا ويريدون سماع كيف يفعله آخرون — بما في ذلك الأجزاء غير "
            "المرتبة التي لن يضعوها في ملف أعمالهم. إن كنت تبحث عن شروح للأدوات أو دورة تدريبية، فسيصيبك هذا البرنامج "
            "بالإحباط. وإن كنت قد أطلقت شيئًا يومًا وتساءلت هل كانت الطريقة صحيحة، فأنت الجمهور.\n\n"
            "نسجل بميكروفون ديناميكي واحد وكثير من الصبر. بعض الحلقات فيها أصوات حركة المرور في الخارج، وكرسي يصرّ، "
            "وضيف يتأخر بسبب مكالمة عميل. أُبقي هذه الأصوات. الشيء الوحيد الذي أحذفه هو التفاصيل السرية: أسماء العملاء، "
            "والأرقام التي تخص شخصًا آخر، وأي شيء قد يضع الضيف في مشكلة. كل ما عدا ذلك يبقى كما حدث، لأن برنامجًا عن "
            "العملية الصادقة لا يمكن أن يكون مصقولًا أكثر من اللازم.\n\n"
            "بنهاية الحلقة يجب أن تكون لديك فكرة واحدة تجربها يوم الاثنين وسؤال واحد تطرحه على فريقك. لا إطار عمل ولا "
            "نظام — تغيير ملموس واحد في طريقة تعاملك مع المشروع القادم. المجتمع مفتوح للمستمعين بين الحلقات، وأفضل "
            "الأحاديث تبدأ غالبًا هناك: شخص يصف نسخته من المشكلة، وآخر عاشها بالفعل. هذا هو معنى الساعة كلها."
        ),
    },
}


def podcast_about_payload(name: str, host: str, locale: str) -> str:
    """Return the `about` copy for a podcast in one locale."""
    override = PODCAST_ABOUT_OVERRIDES.get(name, {}).get(locale)
    if override:
        return override
    template = PODCAST_ABOUT_TEMPLATE.get(locale) or PODCAST_ABOUT_TEMPLATE["en"]
    return template.format(host=host)

PODCAST_TAGS = {
    "fr": "design, apprentissage, entretiens",
    "ar": "تصميم، تعلّم، مقابلات",
}

# The "What you'll learn" bullets shown on the podcast page live in the podcast
# `extra_metadata`; the translation row carries the localized copy.
PODCAST_META_TRANSLATIONS = {
    "The Pixel Hour": {
        "fr": {
            "learnings": [
                "Comment les décisions de design se prennent en coulisses",
                "La vraie histoire derrière les projets terminés",
                "Pourquoi les délais bougent et comment les équipes s'adaptent",
                "Concilier créativité et contraintes pratiques",
            ],
            "target_audience": {
                "for": ["Designers", "Étudiants en design", "Profils produit"],
                "not_for": ["Toute personne cherchant des tutoriels pas à pas"],
            },
            "requirements": ["Une familiarité de base avec les outils de design"],
        },
        "ar": {
            "learnings": [
                "كيف تُتخذ قرارات التصميم خلف الكواليس",
                "القصة الحقيقية وراء المشاريع المنجزة",
                "لماذا تتغير المواعيد وكيف تتكيف الفرق",
                "الموازنة بين الإبداع والقيود العملية",
            ],
            "target_audience": {
                "for": ["مصممون", "طلاب تصميم", "مهتمون بالمنتج"],
                "not_for": ["من يبحث عن دروس خطوة بخطوة"],
            },
            "requirements": ["معرفة أساسية بأدوات التصميم"],
        },
    },
    "Designers Who Ship": {
        "fr": {
            "learnings": [
                "Comment terminer et livrer des projets de design",
                "Ce qui fait sortir un portfolio du lot",
                "Gérer un travail imparfait en production",
                "De vraies leçons d'après-lancement de designers en activité",
            ],
            "target_audience": {
                "for": ["Designers en activité", "Étudiants en design", "Personnes qui construisent un portfolio"],
                "not_for": ["Grands débutants en design"],
            },
            "requirements": ["Une certaine expérience du design"],
        },
        "ar": {
            "learnings": [
                "كيف تنهي مشاريع التصميم وتطلقها",
                "ما يجعل ملف الأعمال يبرز",
                "التعامل مع عمل غير مصقول في الإنتاج",
                "دروس حقيقية بعد الإطلاق من مصممين يمارسون العمل",
            ],
            "target_audience": {
                "for": ["مصممون يمارسون العمل", "طلاب تصميم", "من يبني ملف أعمال"],
                "not_for": ["المبتدئون تمامًا في التصميم"],
            },
            "requirements": ["بعض الخبرة في التصميم"],
        },
    },
    "Two Developers Arguing": {
        "fr": {
            "learnings": [
                "Différentes approches de l'architecture logicielle",
                "Comment évaluer les compromis techniques",
                "Quand changer d'avis sur une décision technique",
                "Les pièges d'architecture courants et comment les repérer",
            ],
            "target_audience": {
                "for": ["Développeurs", "Leads techniques", "Architectes logiciels"],
                "not_for": ["Auditeurs non techniques"],
            },
            "requirements": ["Expérience professionnelle de la programmation"],
        },
        "ar": {
            "learnings": [
                "مقاربات مختلفة للبنية المعمارية للبرمجيات",
                "كيف تقيّم المقايضات التقنية",
                "متى تغيّر رأيك في قرار تقني",
                "مزالق البنية المعمارية الشائعة وكيف تكتشفها",
            ],
            "target_audience": {
                "for": ["مطورون", "قادة تقنيون", "معماريو برمجيات"],
                "not_for": ["المستمعون غير التقنيين"],
            },
            "requirements": ["خبرة مهنية في البرمجة"],
        },
    },
    "The Freelance Files": {
        "fr": {
            "learnings": [
                "Comment gérer les clients difficiles",
                "Fixer ses tarifs et gérer le périmètre",
                "Gérer les paiements en retard avec professionnalisme",
                "Rédiger de meilleurs messages clients",
            ],
            "target_audience": {
                "for": ["Freelances", "Indépendants", "Dirigeants d'agence"],
                "not_for": ["Salariés qui ne comptent pas se mettre à leur compte"],
            },
            "requirements": ["Une certaine expérience du freelance ou des missions clients"],
        },
        "ar": {
            "learnings": [
                "كيف تتعامل مع العملاء الصعبين",
                "تحديد أسعارك وإدارة نطاق العمل",
                "التعامل مع التأخر في الدفع باحترافية",
                "كتابة رسائل أفضل للعملاء",
            ],
            "target_audience": {
                "for": ["المستقلون", "الأفراد المستقلون", "أصحاب الوكالات"],
                "not_for": ["الموظفون الذين لا يخططون للعمل الحر"],
            },
            "requirements": ["بعض الخبرة في العمل الحر أو مع العملاء"],
        },
    },
    "Data Without Drama": {
        "fr": {
            "learnings": [
                "Comment présenter des données clairement à des interlocuteurs non techniques",
                "Choisir le bon graphique pour vos données",
                "Les erreurs courantes de tableaux de bord et leurs correctifs",
                "Transformer des chiffres bruts en enseignements exploitables",
            ],
            "target_audience": {
                "for": ["Analystes de données", "Chefs de produit", "Toute personne qui présente des données"],
                "not_for": ["Data scientists cherchant des mathématiques avancées"],
            },
            "requirements": ["Maîtrise de base des tableurs"],
        },
        "ar": {
            "learnings": [
                "كيف تعرض البيانات بوضوح على جمهور غير تقني",
                "اختيار الرسم البياني المناسب لبياناتك",
                "أخطاء لوحات البيانات الشائعة وكيف تصلحها",
                "تحويل الأرقام الخام إلى رؤى قابلة للتنفيذ",
            ],
            "target_audience": {
                "for": ["محللو بيانات", "مديرو منتجات", "كل من يعرض بيانات"],
                "not_for": ["علماء بيانات يبحثون عن رياضيات متقدمة"],
            },
            "requirements": ["إلمام أساسي بجداول البيانات"],
        },
    },
}

GENERIC_PODCAST_META = {
    "fr": {
        "learnings": [
            "Des éclairages de {host} et de ses invités sur {show}",
            "Des conseils pratiques à appliquer tout de suite",
            "Des histoires vraies de personnes du métier",
            "Les erreurs courantes et comment les éviter",
        ],
        "target_audience": {
            "for": ["Professionnels du domaine", "Étudiants", "Curieux"],
            "not_for": ["Débutants complets"],
        },
        "requirements": ["Aucune connaissance préalable requise"],
    },
    "ar": {
        "learnings": [
            "رؤى من {host} وضيوفه حول {show}",
            "نصائح عملية يمكنك تطبيقها فورًا",
            "قصص حقيقية من أشخاص يعملون في المجال",
            "الأخطاء الشائعة وكيف تتجنبها",
        ],
        "target_audience": {
            "for": ["محترفون في المجال", "طلاب", "مهتمون بالمعرفة"],
            "not_for": ["المبتدئون تمامًا"],
        },
        "requirements": ["لا حاجة إلى معرفة مسبقة"],
    },
}

# ── Episode-level copy ────────────────────────────────────────────────────────
# 15 of the shows share a small pool of generated episode titles/descriptions.
EPISODE_TITLE_VARIANTS = {
    "Notes from the studio": {
        "fr": "Notes du studio",
        "ar": "ملاحظات من الاستوديو",
    },
    "A short one about practice": {
        "fr": "Un court épisode sur la pratique",
        "ar": "حلقة قصيرة عن التدريب",
    },
    "What we got wrong this month": {
        "fr": "Ce que nous avons raté ce mois-ci",
        "ar": "ما أخطأنا فيه هذا الشهر",
    },
    "Questions from listeners": {
        "fr": "Questions des auditeurs",
        "ar": "أسئلة من المستمعين",
    },
}

GENERIC_EPISODE_DESCRIPTIONS = {
    "A short conversation recorded between meetings. Rough audio, honest answers.": {
        "fr": "Une courte conversation enregistrée entre deux réunions. Son brut, réponses honnêtes.",
        "ar": "محادثة قصيرة سُجّلت بين اجتماعين. صوت غير مصقول وإجابات صادقة.",
    },
    "Second episode of the season. We answer one question properly instead of five badly.": {
        "fr": "Deuxième épisode de la saison. Nous répondons correctement à une question au lieu de mal en traiter cinq.",
        "ar": "الحلقة الثانية من الموسم. نجيب عن سؤال واحد بإتقان بدل خمسة على عجل.",
    },
}

# "What you'll learn" and "Key takeaways" shown on the episode page.
GENERIC_EPISODE_META = {
    "fr": {
        "learning_objectives": [
            "Comprendre le sujet central de cet épisode",
            "Identifier les idées clés et les enseignements concrets",
            "Appliquer les concepts abordés à des situations réelles",
        ],
        "key_points": [
            {"title": "Ouverture", "items": ["Introduction au sujet", "Présentation de l'invité ou de l'animateur"]},
            {"title": "Discussion principale", "items": ["L'argument ou l'idée clé", "Un exemple ou une histoire réelle"]},
            {"title": "Conclusion", "items": ["Résumé des points clés", "Ce qu'il faut faire ensuite"]},
        ],
    },
    "ar": {
        "learning_objectives": [
            "فهم الموضوع الأساسي لهذه الحلقة",
            "تحديد الرؤى الرئيسية والخلاصات القابلة للتنفيذ",
            "تطبيق المفاهيم المطروحة على سيناريوهات واقعية",
        ],
        "key_points": [
            {"title": "الافتتاحية", "items": ["مقدمة عن الموضوع", "خلفية الضيف أو المقدم"]},
            {"title": "النقاش الرئيسي", "items": ["الحجة أو الرؤية الأساسية", "مثال أو قصة حقيقية"]},
            {"title": "الخاتمة", "items": ["ملخص الخلاصات الرئيسية", "ما يجب فعله بعد ذلك"]},
        ],
    },
}

FLAGSHIP_EPISODE_META_TRANSLATIONS = {
    0: {
        "fr": {
            "learning_objectives": [
                "Comprendre pourquoi le croquis sur papier accélère les premières décisions de design",
                "Repérer les signaux d'alarme d'une phase de découverte escamotée",
                "Appliquer des techniques de croquis rapide à votre propre workflow",
            ],
            "key_points": [
                {"title": "L'habitude du papier", "items": ["Pourquoi la plupart des designers sautent le papier et le regrettent ensuite", "La différence cognitive entre l'écriture à la main et les outils numériques", "Comment trois semaines de retouches auraient pu être évitées avec cinq minutes de croquis"]},
                {"title": "Étude de cas réelle", "items": ["Le déroulé d'un projet montrant où le papier aurait aidé", "Les leçons de communication client tirées de l'approche ratée", "Le moment exact où l'équipe a réalisé son erreur"]},
                {"title": "À retenir en pratique", "items": ["Trois façons simples d'introduire le papier dans n'importe quel workflow", "Comment convaincre une équipe à distance d'essayer le croquis ensemble", "Des outils et matériaux qui fonctionnent vraiment dans un environnement numérique"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم لماذا يُسرّع الرسم على الورق قرارات التصميم المبكرة",
                "التعرف على علامات التحذير من تخطي مراحل الاستكشاف",
                "تطبيق تقنيات الرسم السريع في سير عملك",
            ],
            "key_points": [
                {"title": "عادة الورق", "items": ["لماذا يتخطى معظم المصممين الورق ويندمون لاحقًا", "الفرق المعرفي بين الكتابة اليدوية والأدوات الرقمية", "كيف كان يمكن تجنب ثلاثة أسابيع من التعديلات بخمس دقائق من الرسم"]},
                {"title": "دراسة حالة واقعية", "items": ["تفكيك الجدول الزمني لمشروع يظهر أين كان الورق سيساعد", "دروس التواصل مع العميل من المقاربة الفاشلة", "اللحظة التي أدرك فيها الفريق خطأه"]},
                {"title": "خلاصات عملية", "items": ["ثلاث طرق سهلة لإدخال الورق في أي سير عمل", "كيف تقنع فريقًا عن بعد بتجربة الرسم معًا", "أدوات ومواد تعمل فعلاً في بيئة رقمية أولاً"]},
            ],
        },
    },
    1: {
        "fr": {
            "learning_objectives": [
                "Maîtriser la grille de 8 points et ses applications concrètes",
                "Identifier quand la grille aide et quand elle gêne",
                "Construire des systèmes d'espacement qui passent d'un écran à l'autre",
            ],
            "key_points": [
                {"title": "Fondamentaux de la grille", "items": ["D'où vient vraiment la règle des 8 points (indice : pas d'un designer)", "Pourquoi 8 fonctionne mieux que 4, 5 ou 10 pour la plupart des interfaces", "Comment gérer les nombres impairs et les espacements irréguliers"]},
                {"title": "Typographie et alignement", "items": ["Mettre en place des grilles de ligne de base compatibles avec le système 8 points", "Gérer automatiquement les calculs de hauteur de ligne et de marge", "Que faire quand votre échelle typographique casse la grille"]},
                {"title": "Quand enfreindre les règles", "items": ["Les deux cas précis où ignorer la grille améliore le design", "Comment faire confiance à son œil sans abandonner le système", "De vrais exemples de designs réussis qui cassent délibérément la grille"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "إتقان نظام شبكة الثماني نقاط وتطبيقاته العملية",
                "تحديد متى تساعد الشبكة ومتى تعيق",
                "بناء أنظمة مسافات تتوسع عبر أحجام شاشات مختلفة",
            ],
            "key_points": [
                {"title": "أساسيات الشبكة", "items": ["من أين جاءت قاعدة الثماني نقاط فعلاً (تلميح: ليس من مصمم)", "لماذا يعمل الرقم 8 أفضل من 4 أو 5 أو 10 في معظم الواجهات", "كيف تتعامل مع الأرقام الفردية والمسافات غير المنتظمة"]},
                {"title": "الخطوط والمحاذاة", "items": ["إعداد شبكات السطر الأساسي المتوافقة مع نظام الثماني", "التعامل التلقائي مع حسابات ارتفاع السطر والهوامش", "ماذا تفعل عندما يكسر مقياس الخطوط الشبكة"]},
                {"title": "متى تكسر القواعد", "items": ["الحالتان المحددتان التي يحسّن فيهما تجاهل الشبكة التصميم", "كيف تثق بعينك دون التخلي عن النظام كليًا", "أمثلة حقيقية لتصاميم جميلة تكسر الشبكة عمدًا"]},
            ],
        },
    },
    2: {
        "fr": {
            "learning_objectives": [
                "Développer une approche structurée des critiques de design en direct",
                "Apprendre à repérer les problèmes d'utilisabilité courants d'une page de tarifs",
                "S'entraîner à refondre rapidement sous contrainte de temps",
            ],
            "key_points": [
                {"title": "Le processus de critique en direct", "items": ["Comment aborder méthodiquement une page jamais vue auparavant", "Les onze problèmes trouvés en quarante minutes, classés par gravité", "Pourquoi la plupart des pages de tarifs échouent au niveau de la hiérarchie avant la couleur ou le texte"]},
                {"title": "Psychologie des prix", "items": ["Comment l'ordre des offres influence la décision", "L'effet d'ancrage et pourquoi l'offre du milieu est rarement un hasard", "Les erreurs de mise en page mobile qui coûtent des conversions"]},
                {"title": "Techniques de refonte rapide", "items": ["Six problèmes corrigés à la volée et les changements exacts", "Travailler sous pression sans sacrifier la qualité", "Outils et méthodes pour prototyper vite pendant une critique"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "تطوير مقاربة منظمة للنقد المباشر للتصميم",
                "تعلم اكتشاف مشكلات سهولة الاستخدام الشائعة في صفحات الأسعار",
                "التدرب على إعادة التصميم السريع تحت ضغط الوقت",
            ],
            "key_points": [
                {"title": "عملية النقد المباشر", "items": ["كيف تتناول صفحة لم ترها من قبل بشكل منهجي", "المشكلات الإحدى عشرة المكتشفة في أربعين دقيقة مرتبة حسب الخطورة", "لماذا تفشل معظم صفحات الأسعار على مستوى التسلسل قبل اللون أو النص"]},
                {"title": "علم نفس الأسعار", "items": ["كيف يؤثر ترتيب الباقات على اتخاذ القرار", "أثر الإرساء ولماذا يكون الخيار الأوسط نادرًا ما عشوائيًا", "أخطاء تخطيط الأسعار على الجوال التي تكلف التحويلات"]},
                {"title": "تقنيات إعادة التصميم السريع", "items": ["ست مشكلات أُصلحت على الفور والتغييرات الدقيقة", "العمل تحت ضغط الوقت دون التضحية بالجودة", "أدوات وسير عمل للنماذج السريعة أثناء النقد"]},
            ],
        },
    },
    3: {
        "fr": {
            "learning_objectives": [
                "Comprendre pourquoi nommer des composants est plus difficile qu'il n'y paraît",
                "Découvrir un cadre pour créer des conventions de nommage communes",
                "Reconnaître l'effet des modèles mentaux sur l'adoption d'un design system",
            ],
            "key_points": [
                {"title": "L'expérience de nommage", "items": ["Comment l'expérience a été conçue et pourquoi elle compte", "Les résultats surprenants lorsque deux designers nomment les mêmes composants", "Les catégories où les désaccords étaient les plus fréquents"]},
                {"title": "Pourquoi le nommage compte", "items": ["Comment un nommage incohérent ralentit les passations aux développeurs", "Le coût caché de renommer des composants déjà construits", "De vrais exemples de conflits de nommage dans des design systems en production"]},
                {"title": "Des conventions qui tiennent", "items": ["Un cadre simple pour nommer n'importe quel composant de façon cohérente", "Comment intégrer de nouveaux membres à un système existant", "Quand privilégier la cohérence à l'expressivité"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم لماذا تكون تسمية المكوّنات أصعب مما تبدو",
                "تعلم إطار لإنشاء اصطلاحات تسمية على مستوى الفريق",
                "إدراك كيف تؤثر النماذج الذهنية المختلفة على تبني نظام التصميم",
            ],
            "key_points": [
                {"title": "تجربة التسمية", "items": ["كيف صُممت التجربة ولماذا تهم", "النتائج المفاجئة عندما يسمي مصممان المكوّنات نفسها", "الفئات التي كانت فيها الخلافات على التسمية أكثر شيوعًا"]},
                {"title": "لماذا تهم التسمية", "items": ["كيف تُبطئ التسمية غير المتسقة عمليات التسليم للمطورين", "التكلفة الخفية لإعادة تسمية المكوّنات بعد بنائها", "أمثلة حقيقية على تعارضات التسمية في أنظمة تصميم إنتاجية"]},
                {"title": "بناء اصطلاحات تسمية تصمد", "items": ["إطار بسيط لتسمية أي مكوّن باتساق", "كيف تدمج أعضاء جدد في نظام تسمية قائم", "متى تُرجّح الاتساق على التعبيرية"]},
            ],
        },
    },
    4: {
        "fr": {
            "learning_objectives": [
                "Comprendre l'écart entre l'intention du designer et la perception de l'utilisateur",
                "Apprendre à mener des tests de perception rapides",
                "Repérer les suppositions courantes qui faussent les décisions de design",
            ],
            "key_points": [
                {"title": "L'écart de perception", "items": ["Comment l'expérience a été conçue et pourquoi des utilisateurs non techniques ont été choisis", "Les cinq réactions et ce que chacune a révélé", "Les éléments de design constamment mal interprétés"]},
                {"title": "Des suppositions qui trompent", "items": ["Pourquoi les designers surestiment l'attention portée aux détails", "Les fonctionnalités totalement manquées face à celles qui ont fasciné", "Comment la connaissance technique change notre regard sur les interfaces"]},
                {"title": "Réduire l'écart", "items": ["Des méthodes de test pratiques qui tiennent dans n'importe quel planning", "Comment poser de meilleures questions en recherche utilisateur", "Prendre l'habitude de valider les suppositions tôt et souvent"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم الفجوة بين نية المصمم وإدراك المستخدم",
                "تعلم كيفية إجراء اختبارات إدراك سريعة",
                "التعرف على الافتراضات الشائعة التي تضلل قرارات التصميم",
            ],
            "key_points": [
                {"title": "فجوة الإدراك", "items": ["كيف صُممت التجربة ولماذا اختير مستخدمون غير تقنيين", "ردود الفعل الخمسة وما كشفه كل منها", "عناصر التصميم التي أُسيء تفسيرها باستمرار"]},
                {"title": "افتراضات مضللة", "items": ["لماذا يبالغ المصممون في تقدير مدى انتباه المستخدمين للتفاصيل", "الميزات التي فاتت المستخدمين تمامًا مقابل تلك التي انشغلوا بها", "كيف تغيّر المعرفة التقنية طريقة رؤيتنا للواجهات"]},
                {"title": "سد الفجوة", "items": ["طرق اختبار عملية تناسب أي جدول زمني", "كيف تطرح أسئلة أفضل في بحث المستخدم", "بناء عادة التحقق من الافتراضات مبكرًا وباستمرار"]},
            ],
        },
    },
    5: {
        "fr": {
            "learning_objectives": [
                "Comprendre ce qui rend une étude de cas mémorable ou oubliable",
                "Saisir la différence entre montrer et raconter dans un portfolio",
                "Construire une structure simple pour tout récit de projet",
            ],
            "key_points": [
                {"title": "Le piège de la capture d'écran", "items": ["Pourquoi de belles images sans contexte nuisent plus qu'elles n'aident", "De vrais exemples de portfolios qui échouent malgré de superbes visuels", "Ce que les recruteurs cherchent vraiment en lisant une étude de cas"]},
                {"title": "Structure narrative", "items": ["Le récit en trois parties qui marche pour tout projet", "Quelle quantité de contexte suffit sans submerger", "Équilibrer l'explication de la démarche et la démonstration du résultat"]},
                {"title": "Avant et après", "items": ["Une étude de cas faible réécrite étape par étape en une étude forte", "Les formulations et choix de cadrage qui font la différence", "Comment mesurer si votre étude de cas fonctionne"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم ما يجعل دراسة الحالة لا تُنسى أو قابلة للنسيان",
                "إدراك الفرق بين العرض والسرد في ملف الأعمال",
                "بناء بنية بسيطة لأي حكاية مشروع",
            ],
            "key_points": [
                {"title": "فخ لقطة الشاشة", "items": ["لماذا تضر الصور الجميلة بلا سياق أكثر مما تنفع", "أمثلة حقيقية لملفات أعمال تفشل رغم بصريات رائعة", "ما يبحث عنه مسؤولو التوظيف فعلاً عند قراءة دراسة حالة"]},
                {"title": "بنية السرد", "items": ["السرد ثلاثي الأجزاء الذي يصلح لأي مشروع", "كم من السياق يكفي دون إثقال", "الموازنة بين شرح العملية وإظهار النتيجة"]},
                {"title": "قبل وبعد", "items": ["دراسة حالة ضعيفة أُعيدت كتابتها خطوة بخطوة إلى قوية", "الصياغات وخيارات التأطير التي تصنع الفرق", "كيف تقيس ما إذا كانت دراسة الحالة تعمل"]},
            ],
        },
    },
    6: {
        "fr": {
            "learning_objectives": [
                "Comprendre ce que les recruteurs privilégient vraiment dans un portfolio junior",
                "Apprendre à structurer un portfolio qui se démarque",
                "Identifier les erreurs les plus fréquentes des candidats juniors",
            ],
            "key_points": [
                {"title": "Ce que cherchent les recruteurs", "items": ["Les qualités précises qui distinguent un portfolio junior parmi soixante", "Pourquoi les projets personnels comptent souvent plus que les travaux de cours", "Comment la personnalité et la voix influencent la décision d'embauche"]},
                {"title": "Erreurs courantes des portfolios juniors", "items": ["La chose qui manque à presque tous les portfolios refusés", "Pourquoi trop expliquer nuit autant que pas assez", "Comment gérer les projets jamais livrés"]},
                {"title": "Conseils concrets", "items": ["Comment organiser une session de relecture de portfolio entre pairs", "Ce qu'il faut inclure et ce qu'il faut laisser de côté", "Le changement le plus impactant que vous pouvez faire cette semaine"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم ما يعطيه مسؤولو التوظيف الأولوية فعلاً في ملفات المبتدئين",
                "تعلم كيفية بناء ملف أعمال يبرز",
                "تحديد الأخطاء الأكثر شيوعًا لدى المتقدمين المبتدئين",
            ],
            "key_points": [
                {"title": "ما يبحث عنه المسؤولون", "items": ["الصفات المحددة التي تجعل ملف مبتدئ يبرز بين ستين", "لماذا تفوق المشاريع الجانبية الأعمال الدراسية غالبًا", "كيف تؤثر الشخصية والصوت على قرار التوظيف"]},
                {"title": "أخطاء شائعة في ملفات المبتدئين", "items": ["الشيء الوحيد الذي يغيب عن معظم الملفات المرفوضة", "لماذا الإفراط في الشرح سيئ كالتقصير فيه", "كيف تتعامل مع مشاريع لم تُطلق أبدًا"]},
                {"title": "نصائح قابلة للتنفيذ", "items": ["كيف تُنظّم جلسة مراجعة ملف الأعمال مع الأقران", "ما تُدرجه وما تستبعده", "التغيير الأكثر أثرًا الذي يمكنك إجراؤه هذا الأسبوع"]},
            ],
        },
    },
    7: {
        "fr": {
            "learning_objectives": [
                "Comprendre les défis particuliers des mises en page bilingues arabe-latin",
                "Apprendre des solutions pratiques aux problèmes d'alignement de ligne de base",
                "Comprendre pourquoi le support RTL dépasse le simple miroir de la mise en page",
            ],
            "key_points": [
                {"title": "Le défi des mises en page bilingues", "items": ["Pourquoi l'arabe et le latin se comportent différemment dans une même mise en page", "Les problèmes d'alignement de ligne de base que la plupart des designers manquent", "Les incohérences de hauteur de ligne et comment les corriger"]},
                {"title": "Au-delà du miroir", "items": ["Pourquoi un simple miroir RTL suffit rarement", "Les différences de hiérarchie typographique entre l'arabe et le latin", "Placement des icônes et poids visuel"]},
                {"title": "Solutions pratiques", "items": ["Outils et techniques pour tester les mises en page bilingues", "Comment construire un système d'espacement qui gère les deux écritures", "De vrais exemples d'interfaces bilingues bien exécutées"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم التحديات الفريدة للتخطيطات ثنائية اللغة عربي-لاتيني",
                "تعلم حلول عملية لمشكلات محاذاة السطر الأساسي",
                "إدراك لماذا يتجاوز دعم RTL مجرد قلب التخطيط",
            ],
            "key_points": [
                {"title": "تحدي التخطيطات ثنائية اللغة", "items": ["لماذا تتصرف الكتابة العربية واللاتينية بشكل مختلف في التخطيط نفسه", "مشكلات محاذاة السطر الأساسي التي يفوّتها معظم المصممين", "تفاوت ارتفاعات الأسطر وكيف تصلحها"]},
                {"title": "أبعد من قلب التخطيط", "items": ["لماذا نادرًا ما يكفي القلب البسيط لـ RTL", "فروق التسلسل الطباعي بين العربية واللاتينية", "موضع الأيقونات والوزن البصري"]},
                {"title": "حلول عملية", "items": ["أدوات وتقنيات لاختبار التخطيطات ثنائية اللغة", "كيف تبني نظام مسافات يتعامل مع الكتابتين", "أمثلة حقيقية لواجهات ثنائية اللغة منفذة بإتقان"]},
            ],
        },
    },
    8: {
        "fr": {
            "learning_objectives": [
                "Comprendre les variables Figma et leurs usages concrets",
                "Découvrir les limites et cas limites des variables",
                "Construire un design system à base de variables qui passe à l'échelle",
            ],
            "key_points": [
                {"title": "Les variables en pratique", "items": ["Comment fonctionnent réellement les variables Figma au-delà du discours marketing", "Configurer des modes pour thèmes, points de rupture et contextes", "Tokens typographiques et gestion des couleurs avec les variables"]},
                {"title": "Ce qui casse et pourquoi", "items": ["Les cas limites qui piègent même les utilisateurs expérimentés", "Les limites de l'implémentation actuelle", "Contournements pour les fonctionnalités pas encore prises en charge"]},
                {"title": "Leçons de production", "items": ["Un retour réel après un usage quotidien depuis la bêta", "Les défis de collaboration autour de bibliothèques de variables partagées", "Stratégies de migration pour les design systems existants"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم متغيرات Figma وتطبيقاتها العملية",
                "التعرف على حدود المتغيرات وحالاتها الحدية",
                "بناء نظام تصميم قائم على المتغيرات يتوسع",
            ],
            "key_points": [
                {"title": "المتغيرات عمليًا", "items": ["كيف تعمل متغيرات Figma فعلاً بعيدًا عن الدعاية", "إعداد أوضاع للثيمات ونقاط التوقف والسياقات", "رموز الخطوط وإدارة الألوان بالمتغيرات"]},
                {"title": "ما يتعطل ولماذا", "items": ["حالات حدية تربك حتى المستخدمين المخضرمين", "حدود التنفيذ الحالي", "حلول بديلة للميزات غير المدعومة بعد"]},
                {"title": "دروس الإنتاج", "items": ["ملاحظات حقيقية من استخدام يومي منذ النسخة التجريبية", "تحديات تعاون الفرق حول مكتبات متغيرات مشتركة", "استراتيجيات الانتقال لأنظمة التصميم القائمة"]},
            ],
        },
    },
    9: {
        "fr": {
            "learning_objectives": [
                "Apprendre à reconnaître quand un design est assez bon pour être livré",
                "Comprendre la notion de rendements décroissants en design",
                "Développer un cadre pour prioriser l'effort de finition",
            ],
            "key_points": [
                {"title": "Le piège du perfectionnisme", "items": ["Pourquoi savoir s'arrêter est l'une des compétences les plus précieuses", "La différence entre une finition qui compte et celle que personne ne remarquera", "De vrais exemples de designs sur-fignolés livrés en retard"]},
                {"title": "Un cadre pour le assez bon", "items": ["Comment évaluer si un design est prêt à être livré", "Les questions à se poser avant de passer une heure de plus sur la finition", "Équilibrer les attentes de qualité et la réalité des délais"]},
                {"title": "Livrer légèrement imparfait", "items": ["Pourquoi les meilleurs designers savent souvent s'arrêter", "Comment gérer son propre malaise face à un travail imparfait", "Les bénéfices à long terme de livrer plus vite et d'itérer en public"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "تعلم تمييز متى يكون التصميم جيدًا بما يكفي للإطلاق",
                "فهم مفهوم العوائد المتناقصة في التصميم",
                "تطوير إطار لتحديد أولويات جهد الصقل",
            ],
            "key_points": [
                {"title": "فخ الكمالية", "items": ["لماذا تُعد معرفة متى تتوقف من أثمن مهارات التصميم", "الفرق بين صقل يهم وصقل لن يلاحظه أحد", "أمثلة حقيقية لتصاميم مفرطة الصقل تأخرت وعانت"]},
                {"title": "إطار لما يكفي", "items": ["كيف تقيّم جاهزية التصميم للإطلاق", "الأسئلة التي تطرحها قبل إنفاق ساعة إضافية على الصقل", "الموازنة بين توقعات الجودة وواقع المواعيد"]},
                {"title": "الإطلاق غير المثالي قليلًا", "items": ["لماذا أفضل المصممين هم غالبًا من يعرفون متى يبتعدون", "كيف تتعامل مع انزعاجك من العمل غير المكتمل", "الفوائد طويلة المدى للإطلاق الأسرع والتحسين العلني"]},
            ],
        },
    },
    10: {
        "fr": {
            "learning_objectives": [
                "Comprendre ce qui rend un thème sombre premium plutôt que cheap",
                "Apprendre les principes de théorie des couleurs pour le mode sombre",
                "Construire une approche systématique du mode sombre",
            ],
            "key_points": [
                {"title": "Fondamentaux du mode sombre", "items": ["Pourquoi les fonds noirs purs donnent un air cheap aux thèmes sombres", "La théorie des couleurs derrière les palettes sombres efficaces", "Ratios de contraste et accessibilité dans les thèmes sombres"]},
                {"title": "Concevoir depuis zéro", "items": ["Pourquoi convertir depuis le mode clair produit des thèmes sombres inférieurs", "Comment construire des tokens sémantiques valables dans les deux modes", "Typographie et iconographie sur fond sombre"]},
                {"title": "Le mode sombre en production", "items": ["De vrais exemples de thèmes sombres premium et cheap", "Pièges d'implémentation courants et comment les éviter", "Tester le mode sombre sur différents appareils et éclairages"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم ما يجعل الثيم الداكن يبدو فاخرًا أو رخيصًا",
                "تعلم مبادئ نظرية الألوان لتصميم الوضع الداكن",
                "بناء مقاربة منهجية لتنفيذ الوضع الداكن",
            ],
            "key_points": [
                {"title": "أساسيات الوضع الداكن", "items": ["لماذا تجعل الخلفيات السوداء الصافية الثيمات الداكنة تبدو رخيصة", "نظرية الألوان وراء لوحات الوضع الداكن الفعّالة", "نسب التباين وإمكانية الوصول في الثيمات الداكنة"]},
                {"title": "التصميم من الأساس", "items": ["لماذا ينتج التحويل من الوضع الفاتح ثيمات داكنة أدنى", "كيف تبني رموز ألوان دلالية تعمل في الوضعين", "اعتبارات الخطوط والأيقونات على الخلفيات الداكنة"]},
                {"title": "الوضع الداكن في الإنتاج", "items": ["أمثلة حقيقية لثيمات داكنة فاخرة وأخرى رخيصة", "مزالق التنفيذ الشائعة وكيف تتجنبها", "اختبار الوضع الداكن عبر أجهزة وإضاءات مختلفة"]},
            ],
        },
    },
    11: {
        "fr": {
            "learning_objectives": [
                "Apprendre à distinguer un retour précieux d'un retour distrayant",
                "Développer un système de filtrage des critiques de design",
                "Comprendre la psychologie derrière nos préférences de retours",
            ],
            "key_points": [
                {"title": "Le paradoxe du retour", "items": ["Pourquoi un retour excitant mène souvent à du travail inutile", "Comment une critique d'apparence ennuyeuse peut être la plus précieuse", "Les raisons psychologiques pour lesquelles certains retours nous attirent"]},
                {"title": "Un système de filtrage", "items": ["Comment décider quel retour appliquer et lequel remercier poliment avant d'ignorer", "Les questions à poser avant d'agir sur un retour", "Construire un processus personnel de tri des retours"]},
                {"title": "Application pratique", "items": ["De vrais exemples de retours qui ont amélioré un design et d'autres qui l'ont déraillé", "Comment demander le type de retour dont vous avez réellement besoin", "Créer une culture d'équipe autour d'une critique efficace"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "تعلم التمييز بين الملاحظات القيّمة والملاحظات المشتتة",
                "تطوير نظام تصفية لنقد التصميم",
                "فهم علم النفس وراء تفضيلاتنا للملاحظات",
            ],
            "key_points": [
                {"title": "مفارقة الملاحظات", "items": ["لماذا تؤدي الملاحظات المثيرة غالبًا إلى جهد ضائع", "كيف يمكن أن يكون النقد الممل ظاهريًا هو الأثمن", "الأسباب النفسية التي تجذبنا لأنواع معينة من الملاحظات"]},
                {"title": "نظام تصفية", "items": ["كيف تقرر أي ملاحظة تنفذ وأيها تشكر صاحبها بأدب ثم تتجاهلها", "أسئلة تطرحها قبل العمل بأي ملاحظة", "بناء عملية فرز شخصية للملاحظات"]},
                {"title": "تطبيق عملي", "items": ["أمثلة حقيقية لملاحظات حسّنت التصاميم وأخرى أفسدته", "كيف تطلب نوع الملاحظات الذي تحتاجه فعلاً", "خلق ثقافة فريق حول نقد فعّال"]},
            ],
        },
    },
    12: {
        "fr": {
            "learning_objectives": [
                "Comprendre ce qui fait réussir une passation design-développement",
                "Apprendre des techniques de préparation qui améliorent la collaboration",
                "Établir de meilleures pratiques de communication entre designers et développeurs",
            ],
            "key_points": [
                {"title": "La passation réussie", "items": ["Ce qui a rendu cette passation particulièrement réussie", "La préparation faite des deux côtés avant la réunion", "Comment le style de communication a influé sur le résultat"]},
                {"title": "Les éléments clés", "items": ["Une documentation de composants que les développeurs lisent vraiment", "Des spécifications d'espacement qui éliminent les suppositions", "Des prototypes d'interaction qui clarifient les comportements complexes"]},
                {"title": "La question essentielle", "items": ["La question la plus importante à poser avant toute réunion de passation", "Comment assurer le suivi après la passation sans être intrusif", "Construire des habitudes de collaboration durable entre design et développement"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "فهم ما يجعل تسليم التصميم للمطورين ناجحًا",
                "تعلم تقنيات تحضير تحسّن التعاون",
                "بناء ممارسات تواصل أفضل بين المصممين والمطورين",
            ],
            "key_points": [
                {"title": "التسليم الناجح", "items": ["ما جعل هذا التسليم ناجحًا بشكل استثنائي", "التحضير الذي قام به الطرفان قبل الاجتماع", "كيف أثّر أسلوب التواصل على النتيجة"]},
                {"title": "عناصر التسليم الأساسية", "items": ["توثيق مكوّنات يقرأه المطورون فعلاً", "مواصفات مسافات تزيل التخمين", "نماذج تفاعل توضح السلوكيات المعقدة"]},
                {"title": "السؤال الوحيد المهم", "items": ["أهم سؤال يجب طرحه قبل أي اجتماع تسليم", "كيف تتابع بعد التسليم دون إزعاج", "بناء عادات تعاون طويلة الأمد بين التصميم والتطوير"]},
            ],
        },
    },
    13: {
        "fr": {
            "learning_objectives": [
                "Entendre des réponses honnêtes aux questions courantes sur la carrière et les tarifs",
                "Comprendre les réalités du secteur de professionnels expérimentés",
                "Obtenir des conseils pratiques pour naviguer dans une carrière de designer",
            ],
            "key_points": [
                {"title": "Les questions d'argent", "items": ["Combien un designer junior devrait facturer et pourquoi", "Des stratégies de négociation qui fonctionnent vraiment", "Quand augmenter ses tarifs et comment préparer la conversation"]},
                {"title": "Conseils de carrière", "items": ["Quand il est temps de quitter un poste et comment repérer les signes", "Les compétences qui compteront le plus en 2026 et après", "Construire un parcours sans formation traditionnelle en design"]},
                {"title": "Réalités du secteur", "items": ["Des réponses honnêtes sur l'état actuel du secteur du design", "L'avenir des outils de design et ce que cela implique", "Les derniers conseils des invités et animateurs de la saison un"]},
            ],
        },
        "ar": {
            "learning_objectives": [
                "سماع إجابات صادقة عن أسئلة المسار المهني والأسعار",
                "فهم واقع المجال من محترفين ذوي خبرة",
                "الحصول على نصائح عملية للتنقل في مسار التصميم",
            ],
            "key_points": [
                {"title": "أسئلة المال", "items": ["كم يجب أن يتقاضى المصمم المبتدئ ولماذا", "استراتيجيات تفاوض تعمل فعلاً", "متى ترفع أسعارك وكيف تستعد للمحادثة"]},
                {"title": "نصائح مهنية", "items": ["متى يحين وقت ترك الوظيفة وكيف تتعرف على العلامات", "المهارات الأهم في 2026 وما بعده", "بناء مسار مهني دون تعليم تصميم تقليدي"]},
                {"title": "واقع المجال", "items": ["إجابات صادقة عن الحالة الحالية لصناعة التصميم", "مستقبل أدوات التصميم وما يعنيه للممارسين", "نصائح ختامية من ضيوف الموسم الأول ومقدميه"]},
            ],
        },
    },
}


# The flagship show has hand-written episodes; each needs its own translation.
FLAGSHIP_EPISODE_TRANSLATIONS = {
    "Why we draw before we design": {
        "fr": (
            "Pourquoi nous dessinons avant de concevoir",
            "Un court plaidoyer pour le papier, et l'histoire d'un projet qui a mal tourné parce que nous l'avons sauté.\n\n"
            "Dans cet épisode, nous expliquons pourquoi le croquis sur papier reste l'un des outils les plus sous-estimés du travail d'un designer. "
            "Notre invitée nous raconte un projet réel où l'impasse sur la phase papier a entraîné trois semaines de retouches inutiles, "
            "et comment un retour aux fondamentaux a sauvé tout le planning.\n\n"
            "Nous parlons aussi des sciences cognitives qui expliquent pourquoi l'écriture à la main active des chemins de résolution différents des outils numériques, "
            "et donnons des conseils pratiques pour intégrer le croquis rapide dans des équipes qui ne l'ont jamais essayé.",
        ),
        "ar": (
            "لماذا نرسم قبل أن نصمم",
            "دفاع قصير عن الورق، وقصة مشروع ساء لأننا تجاوزناه.\n\n"
            "في هذه الحلقة نشرح لماذا يبقى الرسم على الورق من أكثر الأدوات التي لا تُقدّر حقها في عمل المصمم. "
            "تروي لنا ضيفتنا مشروعًا حقيقيًا أدى فيه تخطي مرحلة الورق إلى ثلاثة أسابيع من التعديلات غير الضرورية، "
            "وكيف أن العودة إلى الأساسيات أنقذت الجدول الزمني بالكامل.\n\n"
            "نتحدث أيضًا عن العلم المعرفي الذي يفسر لماذا تفتح الكتابة اليدوية مسارات حل مختلفة عن الأدوات الرقمية، "
            "ونقدم نصائح عملية لإدخال الرسم السريع في فرق لم تجربه من قبل.",
        ),
    },
    "The 8 point grid, honestly": {
        "fr": (
            "La grille de 8 points, sans détour",
            "D'où vient la règle, quand elle aide, et les deux cas où elle gêne.\n\n"
            "La grille de 8 points est devenue un incontournable du design d'interface moderne, mais comme tout outil elle a ses limites. "
            "Nous nous asseyons avec un designer qui l'a appliquée sur des dizaines de projets pour entendre ce qui fonctionne vraiment et ce qui ne fonctionne pas.\n\n"
            "Des systèmes d'espacement à l'alignement typographique, nous couvrons les détails de mise en œuvre rarement abordés dans les tutoriels. "
            "Et nous détaillons les deux situations précises où notre invité recommande d'ignorer complètement la grille et de faire confiance à l'œil.",
        ),
        "ar": (
            "شبكة الثماني نقاط بصراحة",
            "من أين جاءت القاعدة، ومتى تساعد، والحالتان اللتان تعطّلان العمل.\n\n"
            "أصبحت شبكة الثماني نقاط أساسًا في تصميم الواجهات الحديثة، لكنها كأي أداة لها حدودها. "
            "نجلس مع مصمم طبّقها في عشرات المشاريع لنسمع ما ينجح فعلًا وما لا ينجح.\n\n"
            "من أنظمة المسافات إلى محاذاة الخطوط، نغطي تفاصيل التنفيذ التي نادرًا ما تُشرح في الدروس. "
            "ونفصّل الحالتين المحددتين اللتين يوصي فيهما ضيفنا بتجاهل الشبكة تمامًا والثقة بالعين.",
        ),
    },
    "Critiquing a pricing page live": {
        "fr": (
            "Critiquer une page de tarifs en direct",
            "Nous ouvrons une vraie page, trouvons onze problèmes et en corrigeons six en quarante minutes.\n\n"
            "Rien ne révèle mieux ce que nous manquons en concevant seul qu'une critique en direct. "
            "Dans cet épisode, nous prenons une vraie page de tarifs d'un produit SaaS connu et la parcourons section par section.\n\n"
            "À la fin de la séance, nous avons identifié onze problèmes d'utilisabilité, dont six que nous redessinons à la volée. "
            "La conversation couvre la hiérarchie, la psychologie des prix, le responsive mobile et pourquoi la plupart des tableaux de tarifs embrouillent au lieu de convaincre.",
        ),
        "ar": (
            "نقد صفحة أسعار مباشرة",
            "نفتح صفحة حقيقية ونجد أحد عشر مشكلة ونصلح ستًا منها في أربعين دقيقة.\n\n"
            "لا شيء يكشف ما نفوّته عند التصميم وحدنا مثل نقد مباشر. "
            "في هذه الحلقة نأخذ صفحة أسعار حقيقية لمنتج SaaS معروف ونتناولها قسمًا بقسم.\n\n"
            "في نهاية الجلسة كشفنا أحد عشر مشكلة في سهولة الاستخدام، أعدنا تصميم ست منها على الفور. "
            "تتناول المحادثة التسلسل الهرمي وعلم نفس الأسعار والاستجابة للجوال ولماذا تربك معظم جداول الأسعار بدل أن تقنع.",
        ),
    },
    "Naming components with a stranger": {
        "fr": (
            "Nommer des composants avec un inconnu",
            "Un exercice enregistré où deux personnes nomment la même bibliothèque de composants sans se parler.\n\n"
            "Nommer est l'un des problèmes les plus difficiles des design systems, et cet épisode le démontre par l'expérience. "
            "Deux designers reçoivent le même ensemble de composants et doivent les nommer séparément, sans aucune communication.\n\n"
            "Les résultats sont surprenants, parfois drôles, et très révélateurs de la façon dont des personnes différentes interprètent les mêmes éléments visuels. "
            "Nous discutons de ce que cela implique pour la collaboration en équipe et de la manière de construire des conventions de nommage qui tiennent.",
        ),
        "ar": (
            "تسمية المكوّنات مع شخص غريب",
            "تمرين مسجّل يسمّي فيه شخصان مكتبة المكوّنات نفسها دون أن يتحدثا أولًا.\n\n"
            "التسمية من أصعب مشكلات أنظمة التصميم، وهذه الحلقة تثبت ذلك تجريبيًا. "
            "يُعطى مصممان المجموعة نفسها من المكوّنات ويُطلَب منهما تسميتها بشكل مستقل، دون أي تواصل.\n\n"
            "النتائج مفاجئة، وأحيانًا مضحكة، وكاشفة بعمق لكيفية تفسير أشخاص مختلفين للعناصر البصرية نفسها. "
            "نناقش معنى ذلك للتعاون داخل الفريق وكيف نبني اصطلاحات تسمية تصمد فعلاً.",
        ),
    },
    "What clients actually see": {
        "fr": (
            "Ce que les clients voient vraiment",
            "Nous montrons un design à cinq personnes hors du secteur tech et enregistrons leurs premières réactions.\n\n"
            "Il est facile d'oublier que la plupart des gens ne voient pas les interfaces comme les designers. "
            "Dans cette expérience, nous prenons un design soigné et le montrons à cinq utilisateurs non techniques en enregistrant leurs premières réactions sans filtre.\n\n"
            "L'écart entre ce que nous voulions et ce qu'ils perçoivent est à la fois humiliant et instructif. "
            "Nous décortiquons chaque réaction, discutons de ce qu'elle révèle de nos suppositions et partageons des moyens concrets de réduire cet écart dans votre travail.",
        ),
        "ar": (
            "ما يراه العملاء حقًا",
            "نعرض تصميمًا على خمسة أشخاص من خارج التقنية ونسجل ردود فعلهم الأولى.\n\n"
            "من السهل أن ننسى أن معظم الناس لا يرون الواجهات كما يراها المصممون. "
            "في هذه التجربة نأخذ تصميمًا مصقولًا ونعرضه على خمسة مستخدمين غير تقنيين مع تسجيل ردود فعلهم الأولى دون فلترة.\n\n"
            "الفجوة بين ما قصدناه وما أدركوه مذهلة ومفيدة في آن. "
            "نفكّك كل رد فعل، ونناقش ما يكشفه عن افتراضاتنا، ونشارك طرقًا عملية لتضييق هذه الفجوة في عملك.",
        ),
    },
    "The case study problem": {
        "fr": (
            "Le problème de l'étude de cas",
            "Pourquoi les portfolios remplis de captures d'écran échouent, et quoi écrire à la place.\n\n"
            "Une étude de cas de portfolio doit raconter une histoire, pas seulement afficher des captures. "
            "Pourtant, la grande majorité des portfolios de design tombent dans le même piège : de belles images presque sans contexte sur le problème, la démarche ou le résultat.\n\n"
            "Dans cet épisode, nous disséquons ce qui rend une étude de cas mémorable. Nous regardons de vrais exemples, bons et mauvais, "
            "et proposons une structure simple qui transforme n'importe quel projet en récit convaincant. "
            "Si vous mettez à jour votre portfolio, cet épisode pourrait vous faire gagner des heures.",
        ),
        "ar": (
            "مشكلة دراسة الحالة",
            "لماذا تفشل ملفات الأعمال المليئة بلقطات الشاشة، وماذا تكتب بدلًا منها.\n\n"
            "دراسة الحالة في ملف الأعمال يجب أن تروي قصة، لا أن تعرض لقطات فقط. "
            "ومع ذلك يقع معظم مصممي الأعمال في الفخ نفسه: صور جميلة دون سياق عن المشكلة أو العملية أو النتيجة.\n\n"
            "في هذه الحلقة نفكّك ما يجعل دراسة الحالة لا تُنسى. ننظر في أمثلة حقيقية جيدة وسيئة، "
            "ونقترح بنية بسيطة تحوّل أي مشروع إلى سرد مقنع. "
            "إن كنت تحدّث ملف أعمالك فقد توفر عليك هذه الحلقة ساعات من العمل.",
        ),
    },
    "On hiring juniors": {
        "fr": (
            "Recruter des juniors",
            "Un recruteur explique ce qui distingue un portfolio junior parmi soixante.\n\n"
            "Entrer dans le métier est plus dur que jamais, mais les portfolios qui retiennent l'attention partagent des qualités précises. "
            "Un recruteur avec plus de dix ans d'expérience nous explique exactement ce qu'il cherche en examinant des candidatures juniors.\n\n"
            "Nous abordons la différence entre montrer la démarche et montrer la personnalité, pourquoi les projets personnels comptent souvent plus que les travaux de cours, "
            "et la chose qui manque à presque tous les portfolios refusés. "
            "Si vous débutez, cet épisode mérite d'être noté.",
        ),
        "ar": (
            "عن توظيف المبتدئين",
            "مدير توظيف يشرح ما يجعل ملف مبتدئ يبرز بين ستين ملفًا.\n\n"
            "الدخول إلى المجال أصعب من أي وقت مضى، لكن ملفات الأعمال اللافتة تتشارك صفات محددة. "
            "ينضم إلينا مسؤول توظيف بخبرة تتجاوز عشر سنوات ليشرح بالضبط ما يبحث عنه عند مراجعة المتقدمين المبتدئين.\n\n"
            "نتناول الفرق بين إظهار العملية وإظهار الشخصية، ولماذا كثيرًا ما تفوق المشاريع الجانبية الأعمال الدراسية، "
            "والشيء الوحيد الذي يغيب عن معظم الملفات المرفوضة. "
            "إن كنت في بداية مسارك فهذه الحلقة تستحق التدوين.",
        ),
    },
    "Arabic and Latin in one layout": {
        "fr": (
            "Arabe et latin dans une même mise en page",
            "Deux designers parcourent une interface bilingue et les problèmes d'alignement qui en découlent.\n\n"
            "Concevoir des interfaces bilingues mêlant écritures arabe et latine pose des défis que la plupart des designers occidentaux ne rencontrent jamais. "
            "De l'alignement des lignes de base aux incohérences de hauteur de ligne, le diable est dans les détails.\n\n"
            "Deux designers expérimentés en design produit bilingue parcourent une vraie interface et signalent chaque problème d'alignement. "
            "Ils partagent des solutions pratiques et expliquent pourquoi le support RTL ne se limite pas à retourner la mise en page horizontalement. "
            "Une écoute essentielle pour quiconque travaille sur des produits multilingues.",
        ),
        "ar": (
            "العربية واللاتينية في تخطيط واحد",
            "مصممان يستعرضان واجهة ثنائية اللغة ومشكلات المحاذاة التي تتبعها.\n\n"
            "تصميم واجهات ثنائية اللغة تمزج العربية واللاتينية يطرح تحديات لا يواجهها معظم المصممين الغربيين. "
            "من محاذاة السطر الأساسي إلى تفاوت ارتفاعات الأسطر، التفاصيل هي كل شيء.\n\n"
            "يستعرض مصممان بخبرة في المنتجات ثنائية اللغة واجهة حقيقية ويشيران إلى كل مشكلة محاذاة. "
            "يشاركان حلولًا عملية ويناقشان لماذا يتجاوز دعم RTL قلب التخطيط أفقيًا. "
            "استماع ضروري لكل من يعمل على منتجات متعددة اللغات.",
        ),
    },
    "Figma variables, slowly": {
        "fr": (
            "Les variables Figma, sans précipitation",
            "Une heure sur les variables sans battage. Y compris ce qui casse.\n\n"
            "Les variables Figma ont été annoncées avec beaucoup d'enthousiasme, mais leur usage en production est plus nuancé. "
            "Nous passons une heure à les parcourir méthodiquement, sans le battage habituel.\n\n"
            "Notre invité les utilise quotidiennement depuis la bêta et partage un retour honnête sur ce qui marche, ce qui casse et où la fonctionnalité reste insuffisante. "
            "Nous couvrons les modes, les tokens typographiques, la gestion des couleurs et les cas limites qui piègent même les utilisateurs expérimentés.",
        ),
        "ar": (
            "متغيرات Figma بهدوء",
            "ساعة عن المتغيرات بلا مبالغة. بما في ذلك الأجزاء التي تتعطل.\n\n"
            "أُعلن عن متغيرات Figma بحماس كبير، لكن استخدامها الفعلي في الإنتاج أكثر تعقيدًا. "
            "نقضي ساعة في استعراضها بمنهجية، دون الضجيج المعتاد.\n\n"
            "يستخدم ضيفنا المتغيرات يوميًا منذ النسخة التجريبية ويشارك ملاحظات صادقة عمّا ينجح وما يتعطل وأين تقصّر الميزة. "
            "نغطي الأوضاع ورموز الخطوط وإدارة الألوان والحالات الحدية التي تربك حتى المستخدمين المخضرمين.",
        ),
    },
    "When to stop designing": {
        "fr": (
            "Quand arrêter de concevoir",
            "Une conversation sur les rendements décroissants et l'art de livrer quelque chose de légèrement imparfait.\n\n"
            "Savoir quand arrêter de concevoir est l'une des compétences les plus sous-estimées du métier. "
            "Dans cet épisode, nous parlons des rendements décroissants, du perfectionnisme et du courage de livrer quelque chose de légèrement imparfait.\n\n"
            "Notre invitée partage un cadre pour décider quand un design est suffisamment bon, fondé sur des années de livraison sous contraintes. "
            "Nous discutons de la différence entre le soin qui compte et celui que personne ne remarquera, "
            "et pourquoi les meilleurs designers sont souvent ceux qui savent s'arrêter.",
        ),
        "ar": (
            "متى نتوقف عن التصميم",
            "حديث عن العوائد المتناقصة وإطلاق شيء غير مثالي قليلًا.\n\n"
            "معرفة متى تتوقف عن التصميم من أكثر المهارات التي لا تُقدّر حقها في المجال. "
            "في هذه الحلقة نتحدث عن العوائد المتناقصة والكمالية والشجاعة لإطلاق شيء غير مثالي قليلًا.\n\n"
            "تشارك ضيفتنا إطارًا لتحديد متى يكون التصميم جيدًا بما يكفي، مبنيًا على سنوات من إطلاق المنتجات تحت ضغط المواعيد. "
            "نناقش الفرق بين الصقل الذي يهم والصقل الذي لن يلاحظه أحد، "
            "ولماذا أفضل المصممين هم غالبًا من يعرفون متى يبتعدون.",
        ),
    },
    "Dark mode is not a filter": {
        "fr": (
            "Le mode sombre n'est pas un filtre",
            "Couleur, contraste et les raccourcis qui donnent un air cheap aux thèmes sombres.\n\n"
            "Le mode sombre est devenu une fonctionnalité attendue, mais la plupart des implémentations reposent sur des raccourcis qui rendent le résultat cheap. "
            "Inverser les couleurs, utiliser des fonds noirs purs et ignorer les taux de contraste sont des erreurs courantes.\n\n"
            "Nous nous asseyons avec un designer spécialisé en systèmes de couleur pour comprendre ce qui donne vraiment une impression premium à un thème sombre. "
            "Au programme : construction des palettes, hiérarchies de contraste, tokens sémantiques, "
            "et pourquoi les meilleurs modes sombres sont conçus depuis zéro plutôt que convertis depuis le mode clair.",
        ),
        "ar": (
            "الوضع الداكن ليس مرشحًا",
            "اللون والتباين والاختصارات التي تجعل الثيمات الداكنة تبدو رخيصة.\n\n"
            "أصبح الوضع الداكن ميزة متوقعة، لكن معظم التنفيذات تعتمد اختصارات تجعل النتيجة رخيصة. "
            "قلب الألوان واستخدام خلفيات سوداء صافية وتجاهل نسب التباين أخطاء شائعة.\n\n"
            "نجلس مع مصمم متخصص في أنظمة الألوان لنفهم ما يمنح الثيم الداكن حقًا إحساسًا فاخرًا. "
            "تشمل الموضوعات بناء اللوحات اللونية وتسلسل التباين والرموز الدلالية، "
            "ولماذا تُصمم أفضل الأوضاع الداكنة من الأساس بدل تحويلها من الوضع الفاتح.",
        ),
    },
    "The feedback we ignore": {
        "fr": (
            "Les retours que nous ignorons",
            "Pourquoi une critique utile sonne souvent ennuyeuse, et les retours excitants qui font perdre une semaine.\n\n"
            "Tous les retours ne se valent pas. Certaines des critiques les plus précieuses sonnent ennuyeuses au premier abord, "
            "tandis qu'un retour excitant peut vous entraîner dans une impasse qui coûte une semaine.\n\n"
            "Dans cet épisode, nous explorons la psychologie du retour en design, pourquoi nous sommes attirés par certains types de critique, "
            "et comment s'entraîner à reconnaître le retour qui améliore vraiment le travail. "
            "Notre invité partage un système simple de filtrage pour décider quel retour appliquer et lequel remercier poliment avant de l'ignorer.",
        ),
        "ar": (
            "الملاحظات التي نتجاهلها",
            "لماذا تبدو النقدية المفيدة مملة غالبًا، والملاحظات المثيرة التي تضيع أسبوعًا.\n\n"
            "ليست كل الملاحظات متساوية. بعض أثمن النقد يبدو مملًا في البداية، "
            "بينما قد تأخذك ملاحظة مثيرة إلى طريق مسدود يضيع أسبوعًا.\n\n"
            "في هذه الحلقة نستكشف علم نفس الملاحظات في التصميم، ولماذا ننجذب إلى أنواع معينة من النقد، "
            "وكيف ندرّب أنفسنا على تمييز الملاحظة التي تحسّن العمل فعلًا. "
            "يشارك ضيفنا نظام تصفية بسيطًا لتحديد أي ملاحظة ننفذها وأيها نشكر صاحبها بأدب ثم نتجاهلها.",
        ),
    },
    "Working with developers who care": {
        "fr": (
            "Travailler avec des développeurs impliqués",
            "Un développeur et une designer rejouent une passation réussie et expliquent pourquoi.\n\n"
            "Les bonnes passations sont rares, mais quand elles fonctionnent le résultat est magique. Dans cet épisode, une designer et un développeur "
            "rejouent une vraie passation particulièrement réussie et décomposent ce qui a fait sa réussite.\n\n"
            "Ils parlent de la préparation, de la communication et des outils qui ont fait la différence. "
            "Au programme : documentation des composants, spécifications d'espacement, prototypes d'interaction, "
            "et la question la plus importante à poser avant toute réunion de passation.",
        ),
        "ar": (
            "العمل مع مطورين يهتمون",
            "مطور ومصممة يعيدان تمثيل تسليم ناجح ويشرحان السبب.\n\n"
            "عمليات التسليم الجيدة نادرة، لكنها حين تنجح تكون النتائج ساحرة. في هذه الحلقة يعيد مصممة ومطور تمثيل عملية تسليم حقيقية نجحت بامتياز "
            "ويفكّكان أسباب نجاحها.\n\n"
            "يتحدثان عن التحضير والتواصل والأدوات التي صنعت الفرق. "
            "تشمل الموضوعات توثيق المكوّنات ومواصفات المسافات ونماذج التفاعل، "
            "وأهم سؤال يجب طرحه قبل أي اجتماع تسليم.",
        ),
    },
    "Season one questions": {
        "fr": (
            "Questions de la saison un",
            "Les questions des auditeurs, y compris celles sur l'argent.\n\n"
            "Pour le final de la saison, nous ouvrons le micro aux questions des auditeurs. Les sujets vont des tarifs et des négociations "
            "aux conseils de carrière et à l'avenir des outils de design.\n\n"
            "Nous répondons honnêtement aux questions posées, y compris les plus gênantes sur l'argent. "
            "Combien devrait facturer un designer junior ? Quand est-il temps de quitter un poste ? Quelles compétences compteront le plus en 2026 ? "
            "Sans blabla, juste des réponses réelles de gens qui sont passés par là.",
        ),
        "ar": (
            "أسئلة الموسم الأول",
            "أسئلة المستمعين، بما فيها الأسئلة عن المال.\n\n"
            "في ختام الموسم نفتح المجال لأسئلة المستمعين. تتنوع الموضوعات بين التسعير والتفاوض "
            "والنصائح المهنية ومستقبل أدوات التصميم.\n\n"
            "نجيب بصدق عن الأسئلة المطروحة، بما فيها المحرجة عن المال. "
            "كم يجب أن يتقاضى المصمم المبتدئ؟ متى يحين وقت ترك الوظيفة؟ ما المهارات الأهم في 2026؟ "
            "بلا حشو، إجابات حقيقية من أشخاص مروا بالتجربة.",
        ),
    },
}


def podcast_meta_translation_payload(
    name: str, host: str, locale: str, localized_name: str
) -> dict:
    """Return the localized `extra_metadata` for a seeded podcast."""
    specific = PODCAST_META_TRANSLATIONS.get(name, {}).get(locale)
    if specific:
        return specific

    template = GENERIC_PODCAST_META[locale]
    return {
        "learnings": [
            item.format(host=host, show=localized_name)
            for item in template["learnings"]
        ],
        "target_audience": template["target_audience"],
        "requirements": template["requirements"],
    }


def episode_meta_translation_payload(
    order: int, is_flagship: bool, locale: str
) -> dict:
    """Return localized learning objectives / key points for an episode."""
    if is_flagship and order in FLAGSHIP_EPISODE_META_TRANSLATIONS:
        return FLAGSHIP_EPISODE_META_TRANSLATIONS[order][locale]
    return GENERIC_EPISODE_META[locale]


def episode_translation_payload(
    title: str,
    description: str | None,
    order: int = 0,
    is_flagship: bool = False,
) -> dict[str, dict]:
    """Return `{locale: {title, description, extra_metadata}}` for an episode.

    Used by both the fresh seed and the backfill script so the mapping lives in
    one place.
    """
    meta_for = lambda locale: episode_meta_translation_payload(  # noqa: E731
        order, is_flagship, locale
    )

    flagship = FLAGSHIP_EPISODE_TRANSLATIONS.get(title)
    if flagship:
        return {
            locale: {
                "title": localized_title,
                "description": localized_description,
                "extra_metadata": meta_for(locale),
            }
            for locale, (localized_title, localized_description) in flagship.items()
        }

    match = re.match(r"^Episode (\d+): (.+)$", title)
    if not match:
        return {}

    number, variant = match.group(1), match.group(2)
    translations = EPISODE_TITLE_VARIANTS.get(variant)
    if not translations:
        return {}
    descriptions = GENERIC_EPISODE_DESCRIPTIONS.get(description or "", {})
    payload: dict[str, dict] = {}
    for locale, localized_variant in translations.items():
        if locale == "fr":
            localized_title = f"Épisode {number} : {localized_variant}"
        else:
            localized_title = f"الحلقة {number}: {localized_variant}"
        payload[locale] = {
            "title": localized_title,
            "description": descriptions.get(locale, description or ""),
            "extra_metadata": meta_for(locale),
        }
    return payload


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
            about=podcast_about_payload(name, host, "en"),
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
    episodes_by_podcast: dict[str, list[PodcastEpisode]] = {}
    for order, (title, description) in enumerate(C.FLAGSHIP_EPISODES):
        episode = _create_episode(ctx, main, title, description, order)
        episodes_by_podcast.setdefault(main.podcast_uuid, []).append(episode)

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
            episode = _create_episode(ctx, podcast, title, description, order)
            episodes_by_podcast.setdefault(podcast.podcast_uuid, []).append(episode)

    _create_translations(ctx, shows, episodes_by_podcast)


def _create_episode(
    ctx: SeedContext, podcast: Podcast, title: str, description: str, order: int
) -> PodcastEpisode:
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

    episode = PodcastEpisode(
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
    ctx.session.add(episode)
    ctx.session.commit()
    ctx.session.refresh(episode)
    return episode


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


def _create_translations(
    ctx: SeedContext,
    shows: list[Podcast],
    episodes_by_podcast: dict[str, list[PodcastEpisode]],
) -> None:
    hosts = {name: host for name, _description, host in C.PODCASTS}

    for podcast in shows:
        payload = TRANSLATIONS.get(podcast.name)
        if not payload:
            continue
        host = hosts.get(podcast.name, "")
        for locale, (name, description) in payload.items():
            ctx.session.add(
                PodcastTranslation(
                    podcast_id=int(podcast.id or 0),
                    locale=locale,
                    name=name,
                    description=description,
                    about=podcast_about_payload(podcast.name, host, locale),
                    tags=PODCAST_TAGS[locale],
                    extra_metadata=podcast_meta_translation_payload(
                        podcast.name, host, locale, name
                    ),
                    seo=None,
                    state="published",
                    source_updated_at=podcast.update_date,
                    translated_by=None,
                    creation_date=iso(ctx.date_back(40)),
                    update_date=iso(ctx.now),
                )
            )

        for episode in episodes_by_podcast.get(podcast.podcast_uuid, []):
            for locale, translation in episode_translation_payload(
                episode.title,
                episode.description,
                order=episode.order,
                is_flagship=(podcast is shows[0]),
            ).items():
                ctx.session.add(
                    PodcastEpisodeTranslation(
                        episode_id=int(episode.id or 0),
                        locale=locale,
                        title=translation["title"],
                        description=translation["description"],
                        extra_metadata=translation["extra_metadata"],
                        state="published",
                        source_updated_at=episode.update_date,
                        translated_by=None,
                        creation_date=iso(ctx.date_back(40)),
                        update_date=iso(ctx.now),
                    )
                )
    ctx.session.commit()
