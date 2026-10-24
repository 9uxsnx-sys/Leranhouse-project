"""
Template service for in-app notifications.

Provides:
- A registry of built-in default templates for every event type.
- Template resolution (org override -> platform default -> built-in).
- Template rendering (``{{placeholder}}`` substitution).
- An event catalog endpoint for the management UI.

The rendering result (title + body) is **snapshotted** into the
``notification`` row at send time. Editing a template later never rewrites
past notifications.
"""

import logging
import re
from typing import Optional, Tuple

from sqlmodel import Session, select

from src.db.notifications import NotificationTemplate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Built-in default templates
# ---------------------------------------------------------------------------
# These are the fallback when no row exists in notification_template for the
# org.  Keys are event_type; None means the event is not available for
# notification (it may still fire webhooks).
# The audience_rules module determines whether a notification is *sent*;
# this module only controls *what it looks like* when sent.
# ---------------------------------------------------------------------------

# ── Language registry ────────────────────────────────────────────────────
# Maps language codes to their built-in default template dictionaries.
# ---------------------------------------------------------------------------

_TEMPLATE_LANGUAGES: dict[str, str] = {
    "en": "DEFAULT_TEMPLATES_EN",
    "fr": "DEFAULT_TEMPLATES_FR",
    "ar": "DEFAULT_TEMPLATES_AR",
}

DEFAULT_TEMPLATES_EN: dict[str, Optional[dict]] = {
    # ── System ───────────────────────────────────────────────────────
    "ping": None,
    # ── Learning progress ────────────────────────────────────────────
    "course_completed": {
        "title": "Course Completed",
        "body": 'You have completed the course "{{course_name}}".',
        "category": "Learning Progress",
        "link_url": None,
    },
    "course_enrolled": {
        "title": "Enrolled in Course",
        "body": 'You have enrolled in "{{course_name}}".',
        "category": "Learning Progress",
        "link_url": None,
    },
    "activity_completed": {
        "title": "Activity Completed",
        "body": 'You have completed an activity in "{{course_name}}".',
        "category": "Learning Progress",
        "link_url": None,
    },
    "assignment_submitted": {
        "title": "Assignment Submitted",
        "body": 'Your assignment for "{{course_name}}" has been submitted.',
        "category": "Learning Progress",
        "link_url": None,
    },
    "assignment_graded": {
        "title": "Assignment Graded",
        "body": 'Your assignment has been graded. Score: {{grade}}/{{max_grade}} ({{percentage}}%).',
        "category": "Learning Progress",
        "link_url": None,
    },
    "certificate_claimed": {
        "title": "Certificate Earned",
        "body": 'You have received a certificate for "{{course_name}}".',
        "category": "Learning Progress",
        "link_url": None,
    },
    # ── User & access ────────────────────────────────────────────────
    "user_signed_up": {
        "title": "Welcome to the Platform",
        "body": "Welcome, {{first_name}}. Your account has been created successfully.",
        "category": "User & Access",
        "link_url": None,
    },
    "user_email_verified": {
        "title": "Email Verified",
        "body": "Your email address has been verified.",
        "category": "User & Access",
        "link_url": None,
    },
    "user_role_changed": {
        "title": "Role Updated",
        "body": "Your organization role has been updated.",
        "category": "User & Access",
        "link_url": None,
    },
    "user_invited_to_org": {
        "title": "Members Invited",
        "body": "New members have been invited to the organization.",
        "category": "User & Access",
        "link_url": None,
    },
    "user_removed_from_org": {
        "title": "Member Removed",
        "body": "A member has been removed from the organization.",
        "category": "User & Access",
        "link_url": None,
    },
    # ── Course lifecycle ─────────────────────────────────────────────
    "course_created": {
        "title": "Course Created",
        "body": 'A new course has been created: "{{course_name}}".',
        "category": "Course Lifecycle",
        "link_url": None,
    },
    "course_published": {
        "title": "Course Published",
        "body": 'The course "{{course_name}}" has been published.',
        "category": "Course Lifecycle",
        "link_url": None,
    },
    "course_deleted": {
        "title": "Course Deleted",
        "body": 'The course "{{course_name}}" has been deleted.',
        "category": "Course Lifecycle",
        "link_url": None,
    },
    "course_update_published": {
        "title": "New Course Update",
        "body": "A course you are enrolled in has a new update.",
        "category": "Course Lifecycle",
        "link_url": None,
    },
    # ── Content management ───────────────────────────────────────────
    "activity_version_created": {
        "title": "Version Saved",
        "body": "A new version of this activity has been saved.",
        "category": "Content Management",
        "link_url": None,
    },
    "activity_version_restored": {
        "title": "Version Restored",
        "body": "A previous version of this activity has been restored.",
        "category": "Content Management",
        "link_url": None,
    },
    "course_contributor_added": {
        "title": "Contributor Added",
        "body": 'You have been added as a contributor to "{{course_name}}".',
        "category": "Content Management",
        "link_url": None,
    },
    "course_contributor_removed": {
        "title": "Contributor Removed",
        "body": 'You have been removed as a contributor from "{{course_name}}".',
        "category": "Content Management",
        "link_url": None,
    },
    "collection_created": {
        "title": "Collection Created",
        "body": 'A new course collection has been created: "{{name}}".',
        "category": "Content Management",
        "link_url": None,
    },
    "podcast_episode_created": {
        "title": "New Episode",
        "body": 'A new podcast episode has been published: "{{title}}".',
        "category": "Content Management",
        "link_url": None,
    },
    # ── Collaboration ────────────────────────────────────────────────
    "board_created": {
        "title": "Board Created",
        "body": 'A new whiteboard has been created: "{{name}}".',
        "category": "Collaboration",
        "link_url": None,
    },
    "board_member_added": {
        "title": "Added to Board",
        "body": 'You have been added to the whiteboard "{{name}}".',
        "category": "Collaboration",
        "link_url": None,
    },
    "playground_created": {
        "title": "Playground Created",
        "body": 'A new playground has been created: "{{name}}".',
        "category": "Collaboration",
        "link_url": None,
    },
    # ── Community ────────────────────────────────────────────────────
    "discussion_posted": {
        "title": "New Discussion",
        "body": 'A new discussion has been posted: "{{title}}".',
        "category": "Community",
        "link_url": None,
    },
    "comment_created": {
        "title": "New Comment",
        "body": 'A new comment has been posted on "{{title}}".',
        "category": "Community",
        "link_url": None,
    },
    "discussion_pinned": {
        "title": "Discussion Pinned",
        "body": 'The discussion "{{title}}" has been pinned.',
        "category": "Community",
        "link_url": None,
    },
    "discussion_locked": {
        "title": "Discussion Locked",
        "body": 'The discussion "{{title}}" has been locked.',
        "category": "Community",
        "link_url": None,
    },
    "discussion_vote_cast": {
        "title": "Discussion Upvoted",
        "body": 'The discussion "{{title}}" has received an upvote.',
        "category": "Community",
        "link_url": None,
    },
    # ── Groups ───────────────────────────────────────────────────────
    "usergroup_created": {
        "title": "User Group Created",
        "body": 'A new user group has been created: "{{name}}".',
        "category": "Groups",
        "link_url": None,
    },
    "usergroup_deleted": {
        "title": "User Group Deleted",
        "body": 'The user group "{{name}}" has been deleted.',
        "category": "Groups",
        "link_url": None,
    },
    "usergroup_users_added": {
        "title": "Added to Group",
        "body": 'You have been added to the user group "{{name}}".',
        "category": "Groups",
        "link_url": None,
    },
    "usergroup_resources_added": {
        "title": "Resources Added",
        "body": 'New resources have been assigned to the group "{{name}}".',
        "category": "Groups",
        "link_url": None,
    },
    # ── Subscriptions ────────────────────────────────────────────────
    "pack_activated": {
        "title": "Subscription Activated",
        "body": "A subscription pack has been activated.",
        "category": "Subscriptions",
        "link_url": None,
    },
    "pack_deactivated": {
        "title": "Subscription Deactivated",
        "body": "A subscription pack has been deactivated.",
        "category": "Subscriptions",
        "link_url": None,
    },
    # ── Org administration ───────────────────────────────────────────
    "org_signup_method_changed": {
        "title": "Signup Method Updated",
        "body": "The organization signup method has been changed.",
        "category": "Organization",
        "link_url": None,
    },
    "org_ai_config_changed": {
        "title": "AI Configuration Updated",
        "body": "The organization AI configuration has been updated.",
        "category": "Organization",
        "link_url": None,
    },
    "org_payments_config_changed": {
        "title": "Payments Configuration Updated",
        "body": "The organization payments configuration has been updated.",
        "category": "Organization",
        "link_url": None,
    },
}

# ---------------------------------------------------------------------------
# French built-in default templates
# ---------------------------------------------------------------------------

DEFAULT_TEMPLATES_FR: dict[str, Optional[dict]] = {
    "ping": None,
    # ── Learning progress ────────────────────────────────────────────
    "course_completed": {
        "title": "Cours termine",
        "body": 'Vous avez termine le cours "{{course_name}}".',
        "category": "Progres d apprentissage",
        "link_url": None,
    },
    "course_enrolled": {
        "title": "Inscrit au cours",
        "body": 'Vous etes inscrit au cours "{{course_name}}".',
        "category": "Progres d apprentissage",
        "link_url": None,
    },
    "activity_completed": {
        "title": "Activite terminee",
        "body": 'Vous avez termine une activite dans "{{course_name}}".',
        "category": "Progres d apprentissage",
        "link_url": None,
    },
    "assignment_submitted": {
        "title": "Devoir remis",
        "body": 'Votre devoir pour "{{course_name}}" a ete remis.',
        "category": "Progres d apprentissage",
        "link_url": None,
    },
    "assignment_graded": {
        "title": "Devoir note",
        "body": "Votre devoir a ete note. Score: {{grade}}/{{max_grade}} ({{percentage}}%).",
        "category": "Progres d apprentissage",
        "link_url": None,
    },
    "certificate_claimed": {
        "title": "Certificat obtenu",
        "body": 'Vous avez recu un certificat pour "{{course_name}}".',
        "category": "Progres d apprentissage",
        "link_url": None,
    },
    # ── User & access ────────────────────────────────────────────────
    "user_signed_up": {
        "title": "Bienvenue sur la plateforme",
        "body": "Bienvenue, {{first_name}}. Votre compte a ete cree avec succes.",
        "category": "Utilisateurs et acces",
        "link_url": None,
    },
    "user_email_verified": {
        "title": "E-mail verifie",
        "body": "Votre adresse e-mail a ete verifiee.",
        "category": "Utilisateurs et acces",
        "link_url": None,
    },
    "user_role_changed": {
        "title": "Role mis a jour",
        "body": "Votre role dans l organisation a ete mis a jour.",
        "category": "Utilisateurs et acces",
        "link_url": None,
    },
    "user_invited_to_org": {
        "title": "Membres invites",
        "body": "De nouveaux membres ont ete invites dans l organisation.",
        "category": "Utilisateurs et acces",
        "link_url": None,
    },
    "user_removed_from_org": {
        "title": "Membre retire",
        "body": "Un membre a ete retire de l organisation.",
        "category": "Utilisateurs et acces",
        "link_url": None,
    },
    # ── Course lifecycle ─────────────────────────────────────────────
    "course_created": {
        "title": "Cours cree",
        "body": 'Un nouveau cours a ete cree: "{{course_name}}".',
        "category": "Cycle de vie du cours",
        "link_url": None,
    },
    "course_published": {
        "title": "Cours publie",
        "body": 'Le cours "{{course_name}}" a ete publie.',
        "category": "Cycle de vie du cours",
        "link_url": None,
    },
    "course_deleted": {
        "title": "Cours supprime",
        "body": 'Le cours "{{course_name}}" a ete supprime.',
        "category": "Cycle de vie du cours",
        "link_url": None,
    },
    "course_update_published": {
        "title": "Nouvelle mise a jour",
        "body": "Un cours auquel vous etes inscrit a recu une mise a jour.",
        "category": "Cycle de vie du cours",
        "link_url": None,
    },
    # ── Content management ───────────────────────────────────────────
    "activity_version_created": {
        "title": "Version sauvegardee",
        "body": "Une nouvelle version de cette activite a ete sauvegardee.",
        "category": "Gestion de contenu",
        "link_url": None,
    },
    "activity_version_restored": {
        "title": "Version restauree",
        "body": "Une version anterieure de cette activite a ete restauree.",
        "category": "Gestion de contenu",
        "link_url": None,
    },
    "course_contributor_added": {
        "title": "Contributeur ajoute",
        "body": 'Vous avez ete ajoute comme contributeur a "{{course_name}}".',
        "category": "Gestion de contenu",
        "link_url": None,
    },
    "course_contributor_removed": {
        "title": "Contributeur retire",
        "body": 'Vous avez ete retire comme contributeur de "{{course_name}}".',
        "category": "Gestion de contenu",
        "link_url": None,
    },
    "collection_created": {
        "title": "Collection creee",
        "body": 'Une nouvelle collection de cours a ete creee: "{{name}}".',
        "category": "Gestion de contenu",
        "link_url": None,
    },
    "podcast_episode_created": {
        "title": "Nouvel episode",
        "body": 'Un nouvel episode de podcast a ete publie: "{{title}}".',
        "category": "Gestion de contenu",
        "link_url": None,
    },
    # ── Collaboration ────────────────────────────────────────────────
    "board_created": {
        "title": "Tableau cree",
        "body": 'Un nouveau tableau blanc a ete cree: "{{name}}".',
        "category": "Collaboration",
        "link_url": None,
    },
    "board_member_added": {
        "title": "Ajoute au tableau",
        "body": 'Vous avez ete ajoute au tableau blanc "{{name}}".',
        "category": "Collaboration",
        "link_url": None,
    },
    "playground_created": {
        "title": "Terrain de jeu cree",
        "body": 'Un nouveau terrain de jeu a ete cree: "{{name}}".',
        "category": "Collaboration",
        "link_url": None,
    },
    # ── Community ────────────────────────────────────────────────────
    "discussion_posted": {
        "title": "Nouvelle discussion",
        "body": 'Une nouvelle discussion a ete publiee: "{{title}}".',
        "category": "Communaute",
        "link_url": None,
    },
    "comment_created": {
        "title": "Nouveau commentaire",
        "body": 'Un nouveau commentaire a ete poste sur "{{title}}".',
        "category": "Communaute",
        "link_url": None,
    },
    "discussion_pinned": {
        "title": "Discussion epinglee",
        "body": 'La discussion "{{title}}" a ete epinglee.',
        "category": "Communaute",
        "link_url": None,
    },
    "discussion_locked": {
        "title": "Discussion verrouillee",
        "body": 'La discussion "{{title}}" a ete verrouillee.',
        "category": "Communaute",
        "link_url": None,
    },
    "discussion_vote_cast": {
        "title": "Discussion votee",
        "body": 'La discussion "{{title}}" a recu un vote positif.',
        "category": "Communaute",
        "link_url": None,
    },
    # ── Groups ───────────────────────────────────────────────────────
    "usergroup_created": {
        "title": "Groupe d utilisateurs cree",
        "body": 'Un nouveau groupe d utilisateurs a ete cree: "{{name}}".',
        "category": "Groupes",
        "link_url": None,
    },
    "usergroup_deleted": {
        "title": "Groupe d utilisateurs supprime",
        "body": 'Le groupe d utilisateurs "{{name}}" a ete supprime.',
        "category": "Groupes",
        "link_url": None,
    },
    "usergroup_users_added": {
        "title": "Ajoute au groupe",
        "body": 'Vous avez ete ajoute au groupe d utilisateurs "{{name}}".',
        "category": "Groupes",
        "link_url": None,
    },
    "usergroup_resources_added": {
        "title": "Ressources ajoutees",
        "body": 'De nouvelles ressources ont ete attribuees au groupe "{{name}}".',
        "category": "Groupes",
        "link_url": None,
    },
    # ── Subscriptions ────────────────────────────────────────────────
    "pack_activated": {
        "title": "Abonnement active",
        "body": "Un pack d abonnement a ete active.",
        "category": "Abonnements",
        "link_url": None,
    },
    "pack_deactivated": {
        "title": "Abonnement desactive",
        "body": "Un pack d abonnement a ete desactive.",
        "category": "Abonnements",
        "link_url": None,
    },
    # ── Org administration ───────────────────────────────────────────
    "org_signup_method_changed": {
        "title": "Methode d inscription modifiee",
        "body": "La methode d inscription de l organisation a ete modifiee.",
        "category": "Organisation",
        "link_url": None,
    },
    "org_ai_config_changed": {
        "title": "Configuration IA modifiee",
        "body": "La configuration IA de l organisation a ete mise a jour.",
        "category": "Organisation",
        "link_url": None,
    },
    "org_payments_config_changed": {
        "title": "Configuration de paiement modifiee",
        "body": "La configuration de paiement de l organisation a ete mise a jour.",
        "category": "Organisation",
        "link_url": None,
    },
}

# ---------------------------------------------------------------------------
# Arabic built-in default templates
# ---------------------------------------------------------------------------

DEFAULT_TEMPLATES_AR: dict[str, Optional[dict]] = {
    "ping": None,
    # ── Learning progress ────────────────────────────────────────────
    "course_completed": {
        "title": "تم إكمال الدورة",
        "body": 'لقد أكملت الدورة "{{course_name}}".',
        "category": "تقدم التعلم",
        "link_url": None,
    },
    "course_enrolled": {
        "title": "تم التسجيل في الدورة",
        "body": 'لقد سجلت في الدورة "{{course_name}}".',
        "category": "تقدم التعلم",
        "link_url": None,
    },
    "activity_completed": {
        "title": "تم إكمال النشاط",
        "body": 'لقد أكملت نشاطا في "{{course_name}}".',
        "category": "تقدم التعلم",
        "link_url": None,
    },
    "assignment_submitted": {
        "title": "تم تسليم الواجب",
        "body": 'تم تسليم واجبك لدورة "{{course_name}}".',
        "category": "تقدم التعلم",
        "link_url": None,
    },
    "assignment_graded": {
        "title": "تم تصحيح الواجب",
        "body": "تم تصحيح واجبك. الدرجة: {{grade}}/{{max_grade}} ({{percentage}}%).",
        "category": "تقدم التعلم",
        "link_url": None,
    },
    "certificate_claimed": {
        "title": "تم الحصول على الشهادة",
        "body": 'لقد حصلت على شهادة لدورة "{{course_name}}".',
        "category": "تقدم التعلم",
        "link_url": None,
    },
    # ── User & access ────────────────────────────────────────────────
    "user_signed_up": {
        "title": "مرحبا بك في المنصة",
        "body": "مرحبا، {{first_name}}. تم إنشاء حسابك بنجاح.",
        "category": "المستخدم والوصول",
        "link_url": None,
    },
    "user_email_verified": {
        "title": "تم التحقق من البريد",
        "body": "تم التحقق من عنوان بريدك الإلكتروني.",
        "category": "المستخدم والوصول",
        "link_url": None,
    },
    "user_role_changed": {
        "title": "تم تحديث الصلاحية",
        "body": "تم تحديث صلاحياتك داخل المؤسسة.",
        "category": "المستخدم والوصول",
        "link_url": None,
    },
    "user_invited_to_org": {
        "title": "تمت دعوة أعضاء",
        "body": "تمت دعوة أعضاء جدد إلى المؤسسة.",
        "category": "المستخدم والوصول",
        "link_url": None,
    },
    "user_removed_from_org": {
        "title": "تم إزالة عضو",
        "body": "تم إزالة أحد الأعضاء من المؤسسة.",
        "category": "المستخدم والوصول",
        "link_url": None,
    },
    # ── Course lifecycle ─────────────────────────────────────────────
    "course_created": {
        "title": "تم إنشاء الدورة",
        "body": 'تم إنشاء دورة جديدة: "{{course_name}}".',
        "category": "دورة حياة الدورة",
        "link_url": None,
    },
    "course_published": {
        "title": "تم نشر الدورة",
        "body": 'تم نشر الدورة "{{course_name}}".',
        "category": "دورة حياة الدورة",
        "link_url": None,
    },
    "course_deleted": {
        "title": "تم حذف الدورة",
        "body": 'تم حذف الدورة "{{course_name}}".',
        "category": "دورة حياة الدورة",
        "link_url": None,
    },
    "course_update_published": {
        "title": "تحديث جديد للدورة",
        "body": "توجد تحديثات جديدة في إحدى الدورات المسجل بها.",
        "category": "دورة حياة الدورة",
        "link_url": None,
    },
    # ── Content management ───────────────────────────────────────────
    "activity_version_created": {
        "title": "تم حفظ النسخة",
        "body": "تم حفظ نسخة جديدة من هذا النشاط.",
        "category": "إدارة المحتوى",
        "link_url": None,
    },
    "activity_version_restored": {
        "title": "تم استعادة النسخة",
        "body": "تمت استعادة نسخة سابقة من هذا النشاط.",
        "category": "إدارة المحتوى",
        "link_url": None,
    },
    "course_contributor_added": {
        "title": "تمت إضافة مساهم",
        "body": 'تمت إضافتك كمساهم في الدورة "{{course_name}}".',
        "category": "إدارة المحتوى",
        "link_url": None,
    },
    "course_contributor_removed": {
        "title": "تم إزالة المساهم",
        "body": 'تمت إزالتك من قائمة المساهمين في الدورة "{{course_name}}".',
        "category": "إدارة المحتوى",
        "link_url": None,
    },
    "collection_created": {
        "title": "تم إنشاء المجموعة",
        "body": 'تم إنشاء مجموعة دورات جديدة: "{{name}}".',
        "category": "إدارة المحتوى",
        "link_url": None,
    },
    "podcast_episode_created": {
        "title": "حلقة جديدة",
        "body": 'تم نشر حلقة بودكاست جديدة: "{{title}}".',
        "category": "إدارة المحتوى",
        "link_url": None,
    },
    # ── Collaboration ────────────────────────────────────────────────
    "board_created": {
        "title": "تم إنشاء السبورة",
        "body": 'تم إنشاء سبورة بيضاء جديدة: "{{name}}".',
        "category": "تعاون",
        "link_url": None,
    },
    "board_member_added": {
        "title": "تمت الإضافة إلى السبورة",
        "body": 'تمت إضافتك إلى السبورة البيضاء "{{name}}".',
        "category": "تعاون",
        "link_url": None,
    },
    "playground_created": {
        "title": "تم إنشاء الملعب",
        "body": 'تم إنشاء ملعب جديد: "{{name}}".',
        "category": "تعاون",
        "link_url": None,
    },
    # ── Community ────────────────────────────────────────────────────
    "discussion_posted": {
        "title": "نقاش جديد",
        "body": 'تم نشر نقاش جديد: "{{title}}".',
        "category": "مجتمع",
        "link_url": None,
    },
    "comment_created": {
        "title": "تعليق جديد",
        "body": 'تم نشر تعليق جديد على "{{title}}".',
        "category": "مجتمع",
        "link_url": None,
    },
    "discussion_pinned": {
        "title": "تم تثبيت النقاش",
        "body": 'تم تثبيت النقاش "{{title}}".',
        "category": "مجتمع",
        "link_url": None,
    },
    "discussion_locked": {
        "title": "تم إغلاق النقاش",
        "body": 'تم إغلاق النقاش "{{title}}".',
        "category": "مجتمع",
        "link_url": None,
    },
    "discussion_vote_cast": {
        "title": "تم التصويت على النقاش",
        "body": 'حصل النقاش "{{title}}" على تصويت إيجابي.',
        "category": "مجتمع",
        "link_url": None,
    },
    # ── Groups ───────────────────────────────────────────────────────
    "usergroup_created": {
        "title": "تم إنشاء مجموعة مستخدمين",
        "body": 'تم إنشاء مجموعة مستخدمين جديدة: "{{name}}".',
        "category": "المجموعات",
        "link_url": None,
    },
    "usergroup_deleted": {
        "title": "تم حذف المجموعة",
        "body": 'تم حذف مجموعة المستخدمين "{{name}}".',
        "category": "المجموعات",
        "link_url": None,
    },
    "usergroup_users_added": {
        "title": "تمت الإضافة إلى المجموعة",
        "body": 'تمت إضافتك إلى مجموعة المستخدمين "{{name}}".',
        "category": "المجموعات",
        "link_url": None,
    },
    "usergroup_resources_added": {
        "title": "تمت إضافة موارد",
        "body": 'تم تعيين موارد جديدة لمجموعة "{{name}}".',
        "category": "المجموعات",
        "link_url": None,
    },
    # ── Subscriptions ────────────────────────────────────────────────
    "pack_activated": {
        "title": "تم تفعيل الاشتراك",
        "body": "تم تفعيل حزمة اشتراك.",
        "category": "اشتراكات",
        "link_url": None,
    },
    "pack_deactivated": {
        "title": "تم إلغاء الاشتراك",
        "body": "تم إلغاء تفعيل حزمة اشتراك.",
        "category": "اشتراكات",
        "link_url": None,
    },
    # ── Org administration ───────────────────────────────────────────
    "org_signup_method_changed": {
        "title": "تم تحديث طريقة التسجيل",
        "body": "تم تغيير طريقة التسجيل في المؤسسة.",
        "category": "المؤسسة",
        "link_url": None,
    },
    "org_ai_config_changed": {
        "title": "تم تحديث إعدادات الذكاء الاصطناعي",
        "body": "تم تحديث إعدادات الذكاء الاصطناعي للمؤسسة.",
        "category": "المؤسسة",
        "link_url": None,
    },
    "org_payments_config_changed": {
        "title": "تم تحديث إعدادات الدفع",
        "body": "تم تحديث إعدادات الدفع للمؤسسة.",
        "category": "المؤسسة",
        "link_url": None,
    },
}

# Backwards-compatible alias
DEFAULT_TEMPLATES = DEFAULT_TEMPLATES_EN

# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

_PLACEHOLDER_RE = re.compile(r"\{\{(\w+)\}\}")


def _flatten_params(params: dict) -> dict:
    """Flatten nested dicts so ``{{course_name}}`` works without path syntax."""
    flat: dict = {}
    for key, value in params.items():
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                flat[sub_key] = sub_value
        else:
            flat[key] = value
    return flat


def render_template(template: str, params: dict) -> str:
    """
    Replace ``{{placeholder}}`` tokens with values from *params* (flattened).

    Unknown placeholders are left as-is so they are visible in the UI and
    can be fixed by the admin editing the template.
    """
    flat = _flatten_params(params)

    def _replacer(m: re.Match) -> str:
        key = m.group(1)
        val = flat.get(key)
        if val is None:
            return m.group(0)  # leave placeholder visible
        return str(val)

    return _PLACEHOLDER_RE.sub(_replacer, template)


# ---------------------------------------------------------------------------
# Resolution
# ---------------------------------------------------------------------------


def get_effective_template(
    org_id: int,
    event_type: str,
    db_session: Session,
    language: str = "en",
) -> Optional[dict]:
    """
    Return the effective template for *event_type* in *org_id*.

    Resolution order:
      1. Org-specific ``NotificationTemplate`` row (if exists and enabled).
      2. Platform default ``NotificationTemplate`` row (org_id IS NULL).
      3. Built-in ``DEFAULT_TEMPLATES`` entry for the given *language*.

    Falls back to English (``DEFAULT_TEMPLATES_EN``) if the requested language
    has no template dictionary or no entry for the event type.

    Returns ``None`` if the event type has no template at any level (meaning
    the event should produce no notification even if an audience rule fires).
    Returns a dict with keys ``title``, ``body``, ``category``, ``link_url``,
    ``is_enabled``.
    """
    # 1. Org-specific override
    row = db_session.exec(
        select(NotificationTemplate).where(
            NotificationTemplate.org_id == org_id,
            NotificationTemplate.event_type == event_type,
        )
    ).first()
    if row is not None:
        if not row.is_enabled:
            return {"title": None, "body": None, "category": row.category, "link_url": row.link_url, "is_enabled": False}
        return {
            "title": row.title_template,
            "body": row.body_template,
            "category": row.category,
            "link_url": row.link_url or None,
            "is_enabled": True,
        }

    # 2. Platform default
    row = db_session.exec(
        select(NotificationTemplate).where(
            NotificationTemplate.org_id.is_(None),
            NotificationTemplate.event_type == event_type,
        )
    ).first()
    if row is not None:
        if not row.is_enabled:
            return {"title": None, "body": None, "category": row.category, "link_url": row.link_url, "is_enabled": False}
        return {
            "title": row.title_template,
            "body": row.body_template,
            "category": row.category,
            "link_url": row.link_url or None,
            "is_enabled": True,
        }

    # 3. Built-in default for the requested language
    lang_dict_name = _TEMPLATE_LANGUAGES.get(language, "DEFAULT_TEMPLATES_EN")
    lang_dict = globals().get(lang_dict_name, DEFAULT_TEMPLATES_EN)
    built_in = lang_dict.get(event_type)
    if built_in is not None:
        return {
            "title": built_in["title"],
            "body": built_in["body"],
            "category": built_in["category"],
            "link_url": built_in.get("link_url"),
            "is_enabled": True,
        }

    # 4. Fallback to English if the language has no entry for this event
    fallback = DEFAULT_TEMPLATES_EN.get(event_type)
    if fallback is None:
        return None
    return {
        "title": fallback["title"],
        "body": fallback["body"],
        "category": fallback["category"],
        "link_url": fallback.get("link_url"),
        "is_enabled": True,
    }


def render_notification(
    org_id: int,
    event_type: str,
    params: dict,
    db_session: Session,
    language: str = "en",
) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str], bool]:
    """
    Resolve the effective template and render it.

    Returns ``(title, body, category, link_url, is_enabled)``.
    If the event has no template at any level, all values are ``None``.
    If the template is disabled, ``is_enabled`` is ``False``.

    The *language* parameter selects the built-in template dictionary
    (``DEFAULT_TEMPLATES_EN``, ``DEFAULT_TEMPLATES_FR``, or
    ``DEFAULT_TEMPLATES_AR``). Falls back to English if unavailable.
    """
    tmpl = get_effective_template(org_id, event_type, db_session, language=language)
    if tmpl is None:
        return None, None, None, None, False
    if not tmpl["is_enabled"]:
        return None, None, tmpl["category"], tmpl["link_url"], False

    title = render_template(tmpl["title"], params) if tmpl["title"] else None
    body = render_template(tmpl["body"], params) if tmpl["body"] else None
    return title, body, tmpl["category"], tmpl["link_url"], True


# ---------------------------------------------------------------------------
# Event catalog (for the management UI)
# ---------------------------------------------------------------------------


def get_event_catalog(org_id: int, db_session: Session) -> list[dict]:
    """
    Return every event type from ``WEBHOOK_EVENTS`` annotated with its
    notification template status for *org_id*.

    Each entry:
      ``event_type``, ``category``, ``description``,
      ``title_template``, ``body_template``, ``link_url``, ``is_enabled``,
      ``is_customized`` — whether an org-specific override exists.
      ``audience_description`` — short human string describing who receives it.
    """
    from src.services.webhooks.events import WEBHOOK_EVENTS
    from src.services.notifications.service import AUDIENCE_RULES

    catalog = []
    for event_type, ev in WEBHOOK_EVENTS.items():
        # Check for an org-specific override row
        override = db_session.exec(
            select(NotificationTemplate).where(
                NotificationTemplate.org_id == org_id,
                NotificationTemplate.event_type == event_type,
            )
        ).first()

        # Resolve effective template
        effective = get_effective_template(org_id, event_type, db_session)

        audience_rule = AUDIENCE_RULES.get(event_type)
        audience_description = _audience_description(audience_rule) if audience_rule else "—"

        catalog.append(
            {
                "event_type": event_type,
                "category": ev.get("category", "Other"),
                "description": ev.get("description", ""),
                "data_schema": ev.get("data_schema", {}),
                "title_template": override.title_template if override and override.title_template else (effective["title"] if effective else None),
                "body_template": override.body_template if override and override.body_template else (effective["body"] if effective else None),
                "link_url": override.link_url if override and override.link_url else (effective["link_url"] if effective else None),
                "is_enabled": effective["is_enabled"] if effective else False,
                "is_customized": override is not None,
                "has_audience": audience_rule is not None,
                "audience_description": audience_description,
            }
        )
    return catalog


def _audience_description(rule) -> str:
    """Return a short human string describing the audience of a rule."""
    resolve_name = rule.resolve.__name__ if hasattr(rule.resolve, "__name__") else ""
    descriptions = {
        "_resolve_enrolled_student": "The enrolled student",
        "_resolve_assignment_student": "The graded student",
        "_resolve_certificate_student": "The certificate recipient",
        "_resolve_course_enrolled_users": "All enrolled users",
        "_resolve_community_members": "Community members",
    }
    return descriptions.get(resolve_name, "Custom rule")
