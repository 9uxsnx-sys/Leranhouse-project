"""Collections (bundles) with their members and owners."""

from __future__ import annotations

import json

from src.db.collection_translations import CollectionTranslation
from src.db.collections import Collection
from src.db.collections_courses import CollectionCourse
from src.db.collection_users import CollectionUser
from src.db.courses.courses import ThumbnailType
from src.db.payments.enums import AccessTypeEnum
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir

COLLECTION_LEARNINGS = [
    ("Follow a path instead of picking random courses", "\U0001F5FA"),
    ("Save money compared to buying each course alone", "\U0001F4B0"),
    ("Finish with one portfolio ready project", "\U0001F4C4"),
]

TRANSLATIONS = {
    "Backend Starter Pack": {
        "fr": (
            "Pack de démarrage backend",
            "Commencez par le cours backend, puis enchaînez avec les cours SQL et API qui l'accompagnent. "
            "Quatre cours dans l'ordre où nous les enseignons, avec le même projet qui les traverse tous. "
            "Achetez une fois et gardez l'accès à toutes les mises à jour.",
        ),
        "ar": (
            "حزمة البداية في الواجهة الخلفية",
            "ابدأ بدورة الواجهة الخلفية، ثم انتقل إلى دورتي SQL وواجهات البرمجة المرتبطتين بها. "
            "أربع دورات بالترتيب الذي ندرّسها به، مع مشروع واحد يمتد عبرها جميعًا حتى تترابط المهارات. "
            "اشترِ مرة واحدة واحتفظ بالوصول إلى كل التحديثات القادمة.",
        ),
    },
    "Front End Track": {
        "fr": (
            "Parcours front-end",
            "React, mobile et l'API derrière. Achetez les trois ensemble et économisez un peu. "
            "Les cours partagent un seul projet : les écrans que vous construisez dans le premier cours "
            "finissent par afficher de vraies données issues du dernier.",
        ),
        "ar": (
            "مسار الواجهة الأمامية",
            "رياكت وتطبيقات الهاتف وواجهة البرمجة التي تقف خلفها، في مسار واحد مترابط. "
            "اشترِ الدورات الثلاث معًا ووفّر قليلًا من السعر. تشترك الدورات في مشروع واحد، "
            "فالشاشات التي تبنيها في الدورة الأولى تنتهي ببيانات حقيقية قادمة من الدورة الأخيرة.",
        ),
    },
    "Data Track": {
        "fr": (
            "Parcours data",
            "Pandas et SQL sur les mêmes données de boutique en désordre, pour que les deux cours se renforcent. "
            "Vous nettoyez les tables dans un cours et vous les interrogez dans l'autre. "
            "Vous terminez avec un rapport à montrer en entretien.",
        ),
        "ar": (
            "مسار البيانات",
            "Pandas و SQL على بيانات متجر واحدة مليئة بالفوضى، حتى تعزّز الدورتان إحداهما الأخرى بدل أن تتعارضا. "
            "تنظّف الجداول في دورة، وتستعلم عنها في الدورة الأخرى، وتنتهي بتقرير واحد متماسك "
            "يمكنك عرضه في مقابلة عمل أو مشاركته مع فريقك.",
        ),
    },
    "Freelance Bundle": {
        "fr": (
            "Pack freelance",
            "Tarification, contrats et les compétences en design que les clients paient vraiment. "
            "Écrit pour ceux qui maîtrisent déjà les outils et doivent désormais envoyer une facture sans s'excuser.",
        ),
        "ar": (
            "حزمة العمل الحر",
            "التسعير والعقود ومهارات التصميم التي يدفع العملاء ثمنها فعلًا، بعيدًا عن النصائح العامة. "
            "مكتوبة لمن يتقنون الأدوات بالفعل ويحتاجون الآن إلى إرسال فاتورة واضحة دون اعتذار، "
            "والدفاع عن سعرهم بثقة في كل محادثة مع العميل.",
        ),
    },
    "Motion Pack": {
        "fr": (
            "Pack motion",
            "Les bases de l'animation et le cours de montage vidéo. Utile pour les reels et les démos produit. "
            "Vous animez une petite interface, la montez avec de vraies images et exportez quelque chose "
            "qui reste rapide à charger sur un téléphone.",
        ),
        "ar": (
            "حزمة الحركة",
            "أساسيات التحريك ودورة تحرير الفيديو في حزمة واحدة. مفيدة لمقاطع الريلز وعروض المنتجات القصيرة. "
            "تحرّك واجهة صغيرة، تقصّها مع لقطات حقيقية، وتصدّر النتيجة بحجم يبقى سريع التحميل "
            "على الهاتف حتى مع اتصال ضعيف.",
        ),
    },
    "Complete Design Path": {
        "fr": (
            "Parcours design complet",
            "Tout ce que nous enseignons sur le design produit, dans l'ordre où nous l'enseignons. "
            "Le papier d'abord, puis la mise en page, la typographie, les composants et une étude de cas complète. "
            "Si vous partez de zéro, c'est le chemin le plus court dans le catalogue.",
        ),
        "ar": (
            "مسار التصميم الكامل",
            "كل ما ندرّسه في تصميم المنتجات بالترتيب الذي ندرّسه به فعلًا. "
            "الورق أولًا، ثم التخطيط والخطوط والمكونات، وتنتهي بدراسة حالة كاملة من البداية إلى النهاية. "
            "إذا كنت تبدأ من الصفر، فهذا أقصر طريق عبر الكتالوج وأقلها تشتيتًا.",
        ),
    },
    "Backend Track": {
        "fr": (
            "Parcours backend",
            "Automatisation Python et FastAPI. Pour ceux qui veulent construire l'autre moitié. "
            "Deux cours qui vous mènent d'un script exécuté sur votre ordinateur portable "
            "à une API que d'autres peuvent réellement appeler.",
        ),
        "ar": (
            "مسار الواجهة الخلفية",
            "أتمتة بايثون و FastAPI لمن يريدون بناء النصف الآخر من المنتج. "
            "دورتان تأخذانك من سكربت صغير يعمل على حاسوبك المحمول إلى واجهة برمجة حقيقية "
            "يمكن للآخرين استدعاؤها واختبارها دون أن تشرح لهم شيئًا إضافيًا.",
        ),
    },
    "Mobile Track": {
        "fr": (
            "Parcours mobile",
            "React Native et le cours API. Livrez quelque chose sur un téléphone. "
            "Le premier cours vous donne les écrans, le second un backend qui survit "
            "à un vrai utilisateur qui recharge la page.",
        ),
        "ar": (
            "مسار تطبيقات الهاتف",
            "رياكت نيتيف ودورة واجهات البرمجة لتصنع شيئًا ينتهي على هاتف حقيقي. "
            "الدورة الأولى تمنحك الشاشات والتنقل، والثانية تمنحك واجهة خلفية تصمد "
            "أمام مستخدم حقيقي يضغط على إعادة التحميل أكثر من مرة.",
        ),
    },
    "Portfolio Kit": {
        "fr": (
            "Kit portfolio",
            "Rédaction d'études de cas, sessions de critique et deux revues de portfolio. "
            "Pas tant un cours qu'un mois de retours. Vous apportez le travail, "
            "nous apportons les questions gênantes et une échéance que vous ne pouvez pas déplacer.",
        ),
        "ar": (
            "حزمة ملف الأعمال",
            "كتابة دراسات الحالة وجلسات النقد ومراجعتان كاملتان لملف الأعمال. "
            "ليست دورة بقدر ما هي شهر من التغذية الراجعة الصريحة. تأتي بالعمل كما هو، "
            "ونأتي بالأسئلة المحرجة والموعد النهائي الذي لا يمكن تأجيله، حتى يخرج الملف جاهزًا للعرض.",
        ),
    },
    "Photography Pack": {
        "fr": (
            "Pack photographie",
            "Photographie produit et le cours de retouche. Conçu pour les propriétaires de boutiques. "
            "Vous apprenez la lumière, les angles et les réglages d'export "
            "qui gardent une photo nette sur une fiche de place de marché.",
        ),
        "ar": (
            "حزمة التصوير",
            "تصوير المنتجات ودورة التحرير في حزمة واحدة مصممة لأصحاب المتاجر. "
            "تتعلّم الإضاءة والزوايا والقص، ثم إعدادات التصدير التي تحافظ على حدة الصورة وتفاصيلها "
            "في صفحة المتجر وعلى منصات البيع المختلفة.",
        ),
    },
    "Video Pack": {
        "fr": (
            "Pack vidéo",
            "Resolve et les bases du motion. Coupez, étalonnez, exportez, terminé. "
            "Deux cours et un petit reel à la fin, généralement suffisant "
            "pour décrocher le prochain client ou la prochaine conversation.",
        ),
        "ar": (
            "حزمة الفيديو",
            "Resolve وأساسيات الموشن في دورتين قصيرتين. قصّ، تلوين، تصدير، وانتهيت. "
            "تنتهي بمقطع واحد صغير يعرض عملك، وهو عادةً ما يكفي للفوز بالعميل التالي "
            "أو لبدء المحادثة التالية بثقة أكبر.",
        ),
    },
    "Copy and UX Writing": {
        "fr": (
            "Rédaction et UX writing",
            "Le texte d'interface et le cours freelance, pour ceux qui écrivent plus qu'ils ne dessinent. "
            "Commencez par les libellés de boutons et les messages d'erreur, "
            "terminez avec un tarif que vous pouvez annoncer sans trembler.",
        ),
        "ar": (
            "الكتابة التسويقية وتجربة المستخدم",
            "نصوص الواجهات ودورة العمل الحر، لمن يكتبون أكثر مما يرسمون. "
            "ابدأ بتسميات الأزرار ورسائل الخطأ والحالات الفارغة، "
            "وانتهِ بسعر تستطيع أن تقوله بصوت عالٍ دون تردد أمام أي عميل جديد.",
        ),
    },
    "Accessibility Pack": {
        "fr": (
            "Pack accessibilité",
            "Auditez, corrigez, livrez. Deux cours et une checklist. "
            "Le premier vous apprend quoi tester, le second montre comment faire tenir les correctifs "
            "dans une équipe qui livre chaque semaine.",
        ),
        "ar": (
            "حزمة إمكانية الوصول",
            "دقّق، أصلح، وسلّم بثقة. دورتان وقائمة فحص عملية. "
            "الأولى تعلّمك ما يجب اختباره فعلًا، والثانية تُظهر كيف تجعل الإصلاحات صامدة "
            "داخل فريق ينشر كل أسبوع دون أن تعود المشكلة مرة أخرى.",
        ),
    },
    "Career Switch Kit": {
        "fr": (
            "Kit reconversion",
            "Pour ceux qui changent de domaine après trente ans. Cours, talks et groupe d'étude. "
            "Aucune promesse d'emploi en quatre-vingt-dix jours, "
            "juste les compétences et les mots pour expliquer ce que vous savez faire.",
        ),
        "ar": (
            "حزمة تغيير المسار المهني",
            "لمن يغيّرون مجالهم بعد الثلاثين ويحتاجون بداية واضحة. دورات ومحادثات ومجموعة دراسة. "
            "لا وعود بوظيفة خلال تسعين يومًا، فقط المهارات والكلمات التي تشرح ما تجيده "
            "بثقة في المقابلات والمحادثات اليومية.",
        ),
    },
    "Creator Bundle": {
        "fr": (
            "Pack créateur",
            "Photographie, vidéo et production de podcast. Tout pour un petit studio. "
            "Trois cours, un seul montage d'enregistrement et un flux de travail qui tient dans un après-midi.",
        ),
        "ar": (
            "حزمة صانعي المحتوى",
            "التصوير والفيديو وإنتاج البودكاست في حزمة واحدة صُممت لاستوديو صغير. "
            "ثلاث دورات تبدأ من التصوير وتنتهي بإنتاج البودكاست، مع إعداد تسجيل واحد "
            "وسير عمل كامل يُنجز في فترة بعد الظهر.",
        ),
    },
    "Everything Bundle": {
        "fr": (
            "Tout inclus",
            "Tous les cours et podcasts actuels. L'option simple. "
            "Un seul paiement, chaque cours publié, plus les nouvelles leçons dès leur sortie. "
            "Utile si vous n'arrivez pas à choisir et préférez simplement commencer.",
        ),
        "ar": (
            "الحزمة الشاملة",
            "كل الدورات والبودكاست الحالية في خيار واحد بسيط. دفعة واحدة، وكل دورة نشرناها حتى الآن، "
            "مع الدروس الجديدة فور صدورها دون شراء منفصل. مفيدة إن لم تستطع الاختيار "
            "وفضّلت أن تبدأ مباشرة.",
        ),
    },
    "2027 Preview Pack": {
        "fr": (
            "Pack aperçu 2027",
            "Pack provisoire pour l'année prochaine. Ne pas publier encore. "
            "Texte provisoire pour que la grille ne soit pas vide pendant que nous décidons "
            "de son contenu et de son prix.",
        ),
        "ar": (
            "حزمة معاينة 2027",
            "حزمة أولية للعام القادم نضعها الآن كمعاينة فقط. لا تنشرها بعد. "
            "النص مؤقت حتى لا تبقى الشبكة فارغة بينما نقرّر ما ينتمي إلى هذه الحزمة "
            "وكيف نُسعّرها للطلاب الجدد.",
        ),
    },
    "Team Training Pack": {
        "fr": (
            "Pack formation d'équipe",
            "Pack provisoire pour la formation en entreprise. En attente de validation tarifaire. "
            "Texte provisoire jusqu'à ce que la question de la facturation soit réglée "
            "et que les deux premières entreprises s'accordent sur un format.",
        ),
        "ar": (
            "حزمة تدريب الفرق",
            "حزمة أولية لتدريب الشركات، بانتظار اعتماد التسعير النهائي. "
            "النص مؤقت حتى تُحسم مسألة الفواتير وتتفق أول شركتين على الصيغة والمدة "
            "قبل نشر الحزمة للعملاء.",
        ),
    },
}

# Body copy shared by every collection, per locale. The English source lives in
# COLLECTION_LEARNINGS, the `tags` string and the two `about` / metadata variants
# inside create_collections(); these are their full translations.
COLLECTION_SHARED = {
    "fr": {
        "learnings": [
            (
                "Suivre un parcours au lieu de choisir des cours au hasard",
                "\U0001F5FA",
            ),
            (
                "Économiser par rapport à l'achat séparé de chaque cours",
                "\U0001F4B0",
            ),
            (
                "Terminer avec un projet prêt pour votre portfolio",
                "\U0001F4C4",
            ),
        ],
        "tags": "pack, parcours, cours",
        "about_default": (
            "Un pack que nous avons assemblé parce que les gens demandaient sans cesse "
            "par quel cours commencer. Commencez par le haut et descendez, "
            "ou allez directement à la partie dont vous avez besoin."
        ),
        "about_flagship": (
            "Ce pack existe parce que les gens n'arrêtaient pas de demander par quel cours "
            "commencer et dans quel ordre. Nous l'avons conçu comme un parcours unique à travers "
            "les quatre cours les plus importants pour le travail backend, avec le même projet "
            "qui les traverse tous, pour que vous n'ayez jamais à repartir de zéro deux fois.\n\n"
            "Le cours phare, Developpement backend avec Python, est le premier et le plus long. "
            "Il vous mène d'un dossier vide à une API en fonctionnement, avec une vraie base de "
            "données, l'authentification, des tests et un déploiement. Les trois cours suivants "
            "reprennent là où il s'arrête. SQL qui repond aux vraies questions vous apprend à "
            "interroger cette base sans deviner, et API backend avec FastAPI ajoute des endpoints, "
            "des middlewares et le type de gestion d'erreurs qui survit à un déploiement en "
            "production. Le quatrième cours, Python pour automatiser le quotidien, est plus léger "
            "et sert de respiration entre les semaines intenses.\n\n"
            "Nous avons organisé les quatre cours dans l'ordre où nous les enseignons en interne, "
            "ce qui signifie que chacun suppose que vous avez terminé le précédent. Le cours SQL "
            "interroge la base de données que vous avez construite dans le cours phare. Le cours "
            "API étend la même base de code. Si vous sautez une étape, les exercices fonctionnent "
            "toujours, mais le contexte du fichier projet ne sera pas aussi clair qu'il devrait "
            "l'être. Tenez-vous à l'ordre pour la première passe, puis revenez à n'importe quel "
            "cours individuellement plus tard.\n\n"
            "Achetez une fois et gardez l'accès à toutes les mises à jour. Nous ajoutons de "
            "nouvelles leçons à ces cours au fur et à mesure que nous les enregistrons, et le prix "
            "du pack ne change jamais après votre achat. Si vous possédez déjà l'un des cours, le "
            "prix du pack s'ajuste automatiquement pour que vous ne payiez jamais deux fois le même "
            "contenu. Le canal communautaire reste ouvert aussi longtemps que vous en avez besoin, "
            "et la plupart des gens qui terminent le pack restent pour relire le travail des autres "
            "bien après.\n\n"
            "Vous avez besoin des bases de Python avant de commencer : les fonctions, les listes, "
            "les dictionnaires, et l'envie de lire un message d'erreur à voix haute. Vous n'avez pas "
            "besoin d'expérience backend, de Docker ni d'un compte cloud. Si vous avez écrit un petit "
            "script sans être tout à fait sûr de pourquoi il fonctionnait, ce pack est exactement "
            "pour vous. Les outils sont FastAPI, Postgres, SQLModel et pytest, que vous rencontrerez "
            "dans la plupart des emplois backend par ici."
        ),
        "requirements_default": [
            "Des compétences informatiques de base et une connexion internet stable",
            "L'envie d'apprendre quelque chose de nouveau",
        ],
        "requirements_flagship": [
            "Les bases de Python : fonctions, listes, dictionnaires — de quoi écrire et exécuter "
            "un petit script",
            "Un ordinateur avec une connexion internet stable",
            "L'envie de lire les messages d'erreur à voix haute",
            "Aucune expérience en backend ni en Docker requise — nous partons de zéro",
        ],
        "audience_default": {
            "for": [
                "Les apprenants qui veulent un parcours sélectionné plutôt que des cours choisis "
                "au hasard",
                "Les étudiants qui cherchent à économiser par rapport à l'achat séparé des cours",
            ],
            "not_for": [
                "Les apprenants qui n'ont besoin que d'un seul cours du pack",
            ],
        },
        "audience_flagship": {
            "for": [
                "Débutants en Python qui ont écrit quelques scripts et veulent construire de vrais "
                "projets backend",
                "Développeurs autodidactes cherchant un parcours structuré en ingénierie backend",
                "Personnes en reconversion vers le développement web avec un peu d'expérience "
                "en programmation",
            ],
            "not_for": [
                "Ingénieurs backend expérimentés qui publient déjà des API en production",
                "Débutants complets en programmation — commencez par une introduction à Python",
            ],
        },
    },
    "ar": {
        "learnings": [
            ("اتبع مسارًا بدل اختيار دورات عشوائية", "\U0001F5FA"),
            ("وفّر المال مقارنة بشراء كل دورة على حدة", "\U0001F4B0"),
            ("انتهِ بمشروع واحد جاهز لملف أعمالك", "\U0001F4C4"),
        ],
        "tags": "حزمة, مسار, دورات",
        "about_default": (
            "حزمة جمعناها لأن الناس ظلوا يسألون عن الدورة التي يبدأون بها. "
            "ابدأ من الأعلى وتدرّج، أو انتقل مباشرة إلى الجزء الذي تحتاجه."
        ),
        "about_flagship": (
            "هذه الحزمة موجودة لأن الناس ظلوا يسألون عن الدورة التي يبدأون بها وبأي ترتيب. "
            "صمّمناها كمسار واحد عبر الدورات الأربع الأكثر أهمية في العمل على الواجهة الخلفية، "
            "مع مشروع واحد يمتد عبرها جميعًا حتى لا تضطر إلى البدء من الصفر مرتين.\n\n"
            "الدورة الأساسية، هندسة الواجهة الخلفية ببايثون، هي الأولى والأطول. تأخذك من مجلد "
            "فارغ إلى واجهة برمجة تعمل، مع قاعدة بيانات حقيقية والمصادقة والاختبارات والنشر. "
            "الدورات الثلاث التي تليها تكمل من حيث تتوقف. دورة SQL الذي يجيب عن اسئلة حقيقية "
            "تعلّمك الاستعلام عن تلك القاعدة دون تخمين، ودورة واجهات برمجة خلفية مع FastAPI "
            "تضيف المسارات والوسائط البرمجية ونوع معالجة الأخطاء الذي يصمد في النشر الإنتاجي. "
            "الدورة الرابعة، بايثون لاتمتة المهام اليومية، أخف وتعمل كاستراحة بين الأسابيع المكثفة.\n\n"
            "رتّبنا الدورات الأربع بالترتيب الذي ندرّسها به داخليًا، أي أن كل دورة تفترض أنك "
            "أنهيت التي قبلها. دورة SQL تستعلم عن قاعدة البيانات التي بنيتها في الدورة الأساسية. "
            "ودورة واجهات البرمجة توسّع قاعدة الشيفرة نفسها. إذا تقدّمت في الترتيب، فستعمل "
            "التمارين، لكن سياق ملف المشروع لن يكون واضحًا كما ينبغي. التزم بالترتيب في الجولة "
            "الأولى، ثم عُد إلى أي دورة على حدة لاحقًا.\n\n"
            "اشترِ مرة واحدة واحتفظ بالوصول إلى كل التحديثات. نضيف دروسًا جديدة إلى هذه الدورات "
            "عند تسجيلها، ولا يتغيّر سعر الحزمة بعد الشراء. إذا كنت تملك إحدى الدورات بالفعل، "
            "يُعدّل سعر الحزمة تلقائيًا حتى لا تدفع مرتين مقابل المحتوى نفسه. تبقى قناة المجتمع "
            "مفتوحة طالما احتجتها، ومعظم من يُكمل الحزمة يبقون لمراجعة عمل بعضهم البعض بعد ذلك "
            "بوقت طويل.\n\n"
            "تحتاج إلى أساسيات بايثون قبل البدء: الدوال والقوائم والقواميس، والاستعداد لقراءة "
            "رسالة خطأ بصوت عالٍ. لا تحتاج إلى خبرة في الواجهة الخلفية أو Docker أو حساب سحابي. "
            "إذا كتبت سكربتًا صغيرًا ولم تكن متأكدًا تمامًا من سبب نجاحه، فهذه الحزمة صُممت لك "
            "تحديدًا. الأدوات هي FastAPI و Postgres و SQLModel و pytest، وستقابلها في معظم وظائف "
            "الواجهة الخلفية هنا."
        ),
        "requirements_default": [
            "مهارات حاسوب أساسية واتصال إنترنت مستقر",
            "الرغبة في تعلّم شيء جديد",
        ],
        "requirements_flagship": [
            "أساسيات بايثون: الدوال والقوائم والقواميس — بما يكفي لكتابة سكربت صغير وتشغيله",
            "حاسوب مع اتصال إنترنت مستقر",
            "الاستعداد لقراءة رسائل الخطأ بصوت عالٍ",
            "لا حاجة لخبرة في الواجهة الخلفية أو Docker — نبدأ من الصفر",
        ],
        "audience_default": {
            "for": [
                "المتعلمون الذين يريدون مسارًا منسقًا بدل اختيار دورات عشوائية",
                "الطلاب الذين يبحثون عن توفير مقارنة بشراء الدورات بشكل منفرد",
            ],
            "not_for": [
                "المتعلمون الذين يحتاجون دورة واحدة فقط من الحزمة",
            ],
        },
        "audience_flagship": {
            "for": [
                "مبتدئو بايثون الذين كتبوا بعض السكربتات ويريدون بناء مشاريع خلفية حقيقية",
                "مطورون علموا أنفسهم ويبحثون عن مسار منظم في هندسة الواجهة الخلفية",
                "من يغيّرون مسارهم المهني نحو تطوير الويب ولديهم بعض الخبرة البرمجية",
            ],
            "not_for": [
                "مهندسو واجهة خلفية متمرسون ينشرون واجهات برمجة في الإنتاج بالفعل",
                "مبتدئون تمامًا في البرمجة — ابدأ بدورة تمهيدية في بايثون أولًا",
            ],
        },
    },
}


def create_collections(ctx: SeedContext) -> None:
    published_courses = [course for course in ctx.courses if course.published]
    if not published_courses:
        return

    base = org_content_dir(ctx.content_root, ctx.org_uuid) / "collections"
    created_collections = []

    for index, (name, description, access, price) in enumerate(C.COLLECTIONS):
        collection_uuid = new_uuid("collection")
        collection_dir = base / collection_uuid
        created = ctx.date_between(145, 20)
        learnings = json.dumps(
            [
                {"id": f"learning-{position}", "text": text, "emoji": emoji}
                for position, (text, emoji) in enumerate(COLLECTION_LEARNINGS)
            ]
        )
        is_flagship = index == 0
        extra_metadata = (
            {
                "requirements": json.dumps([
                    {"text": "Python basics: functions, lists, dictionaries — enough to write and run a small script"},
                    {"text": "A computer with a stable internet connection"},
                    {"text": "Willingness to read error messages out loud"},
                    {"text": "No backend or Docker experience required — we start from zero"},
                ]),
                "difficulty": "Intermediate",
                "duration": "42h",
                "lessons_count": 0,
                "video_hours": 28,
                "resources_count": 12,
                "has_certificate": True,
                "target_audience": {
                    "for": [
                        "Python beginners who have written a few scripts and want to build real backend projects",
                        "Self-taught developers looking for a structured path through backend engineering",
                        "Career switchers moving into web development with some coding experience",
                    ],
                    "not_for": [
                        "Experienced backend engineers who already ship APIs in production",
                        "Complete programming beginners — take an intro to Python first",
                    ],
                },
            }
            if is_flagship
            else {
                "requirements": json.dumps([
                    {"text": "Basic computer skills and a stable internet connection"},
                    {"text": "A desire to learn something new"},
                ]),
                "target_audience": {
                    "for": [
                        "Learners who want a curated path instead of picking random courses",
                        "Students looking to save money compared to buying courses individually",
                    ],
                    "not_for": [
                        "Learners who only need a single course from the bundle",
                    ],
                },
            }
        )
        collection = Collection(
            name=name,
            public=True,
            description=description,
            org_id=ctx.org_id,
            collection_uuid=collection_uuid,
            extra_metadata=extra_metadata,
            about=(
                "This bundle exists because people kept asking which course to start with and in what order. "
                "We designed it as a single path through the four courses that matter most for backend work, "
                "with the same project running through all of them so you never have to start from scratch twice.\n\n"
                "The flagship course, Backend Engineering with Python, is the first and longest. It takes you from "
                "an empty folder to a running API with a real database, authentication, tests and deployment. "
                "The three courses that follow pick up where it leaves off. SQL That Answers Real Questions teaches "
                "you to query that database without guessing, and Backend APIs with FastAPI adds endpoints, "
                "middleware and the kind of error handling that survives a production deploy. The fourth course, "
                "Python for Everyday Automation, is lighter and works as a breather between the heavy weeks.\n\n"
                "We arranged the four courses in the order we teach them internally, which means each one assumes "
                "you finished the previous one. The SQL course queries the database you built in the flagship. "
                "The API course extends the same codebase. If you skip ahead, the exercises still work, but the "
                "context of the project file will not be as clear as it should be. Stick to the order for the "
                "first pass, then come back to any course individually later.\n\n"
                "Buy once and keep access to every update. We add new lessons to these courses as we record them, "
                "and the bundle price never changes after you purchase. If you already own one of the courses, "
                "the bundle price adjusts automatically so you never pay twice for the same content. The community "
                "channel stays open as long as you need it, and most people who finish the bundle stay to review "
                "each other's work long after.\n\n"
                "You need Python basics before you start: functions, lists, dictionaries, and the willingness to "
                "read an error message out loud. You do not need backend experience, Docker or a cloud account. "
                "If you have written a small script and were not entirely sure why it worked, you are exactly "
                "who this bundle is for. The tools are FastAPI, Postgres, SQLModel and pytest, all of which you "
                "will meet in most backend jobs around here."
            ) if is_flagship else (
                "A bundle we put together because people kept asking which courses to take first. "
                "Start at the top and work down, or jump to the part you need."
            ),
            learnings=learnings,
            tags="bundle, path, courses",
            thumbnail_type=ThumbnailType.IMAGE,
            thumbnail_image=(
                ctx.named_image(
                    collection_dir / "thumbnails",
                    "thumb",
                    "design/collection flasgship.jpg",
                )
                if index == 0
                else ctx.image(
                    collection_dir / "thumbnails",
                    "thumb",
                    C.COLLECTION_NICHES.get(name),
                )
            ),
            thumbnail_video="",
            banner_image=(
                ctx.named_image(
                    collection_dir / "banners", "banner", "collection banner.png"
                )
                if index == 0
                else ""
            ),
            published=index < 16,
            access_type=AccessTypeEnum(access.lower()),
            price_amount=price,
            price_currency="DZD",
            seo=None,
            source_locale="en",
            creation_date=iso(created),
            update_date=iso(created),
        )
        ctx.session.add(collection)
        ctx.session.commit()
        ctx.session.refresh(collection)
        created_collections.append(collection)

    ctx.collections = created_collections

    for index, collection in enumerate(created_collections[:16]):
        if index == 0 and ctx.flagship is not None:
            # The collection opened on camera always leads with the flagship
            # course, followed by the three courses the description mentions.
            wanted = [
                "Python for Everyday Automation",
                "SQL That Answers Real Questions",
                "Backend APIs with FastAPI",
            ]
            members = [ctx.flagship] + [
                course for name in wanted for course in published_courses if course.name == name
            ]
        else:
            members = ctx.rng.sample(
                published_courses, ctx.rng.randint(3, min(6, len(published_courses)))
            )
        for course in members:
            ctx.session.add(
                CollectionCourse(
                    collection_id=int(collection.id or 0),
                    course_id=int(course.id or 0),
                    org_id=ctx.org_id,
                    creation_date=iso(ctx.date_back(60)),
                    update_date=iso(ctx.now),
                    resource_type="course",
                    resource_uuid=course.course_uuid,
                )
            )
        for student in ctx.rng.sample(ctx.students, ctx.rng.randint(3, 7)):
            ctx.session.add(
                CollectionUser(
                    collection_id=int(collection.id or 0),
                    user_id=int(student.id or 0),
                    org_id=ctx.org_id,
                    creation_date=iso(ctx.date_back(50)),
                    update_date=iso(ctx.now),
                )
            )
    ctx.session.commit()

    for index, collection in enumerate(created_collections):
        payload = TRANSLATIONS.get(collection.name)
        if not payload:
            continue
        variant = "flagship" if index == 0 else "default"
        for locale, (name, description) in payload.items():
            shared = COLLECTION_SHARED[locale]
            learnings = json.dumps(
                [
                    {"id": f"learning-{position}", "text": text, "emoji": emoji}
                    for position, (text, emoji) in enumerate(shared["learnings"])
                ]
            )
            requirements = json.dumps(
                [{"text": text} for text in shared[f"requirements_{variant}"]]
            )
            ctx.session.add(
                CollectionTranslation(
                    collection_id=int(collection.id or 0),
                    locale=locale,
                    name=name,
                    description=description,
                    about=shared[f"about_{variant}"],
                    learnings=learnings,
                    tags=shared["tags"],
                    seo=None,
                    extra_metadata={
                        "requirements": requirements,
                        "target_audience": shared[f"audience_{variant}"],
                    },
                    state="published",
                    source_updated_at=collection.update_date,
                    translated_by=None,
                    creation_date=iso(ctx.date_back(30)),
                    update_date=iso(ctx.now),
                )
            )
    ctx.session.commit()
