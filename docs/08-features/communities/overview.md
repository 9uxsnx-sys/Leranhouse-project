> Status: as-built · Last verified: 2026-11-15

# Communities

A community is a discussion space attached to exactly one course or podcast; it inherits that resource's access rules and adds discussions, comments, reactions and votes.

## Feature flag

Communities are an optional feature resolved per organization, not an always-on module.

| Layer | How it is read |
|---|---|
| Backend | `resolve_feature("communities", …)` in `security/features_utils/resolve.py` runs through deployment mode, plan, overrides, purchased packs and the admin toggle |
| Public API payload | The resolved value is exposed as `organization.config.config.resolved_features.communities` |
| Frontend | `FeatureDisabledView` reads `resolved_features.communities.enabled`, falling back to `features.communities.enabled !== false`; `UserLeftMenu` shows the entry only when the resolved flag is `true` |
| Effect | The Communities entry disappears from the learner menu, and both the learner listing and the dashboard render a full disabled screen |

Communities are not in `EE_ONLY_FEATURES`, so OSS and EE deployments enable them unless an admin disables the toggle; SaaS plans add their own requirement.

## Access model

There is no separate community ACL. A community delegates to its linked resource through `ResourceAccessChecker._check_community_access`, so one access implementation serves both.

| Rule | Behaviour |
|---|---|
| Inheritance | Reading follows the parent course/podcast: publication, access type, entitlement, user groups, authorship and org-admin status |
| Draft switch | `community.published` is an extra switch; an unpublished community is hidden from non-admins even when the parent is readable |
| Free parent | The learner must first claim the parent (a `TrailRun` for the course or podcast) unless they are an admin, author or role-granted reader |
| Orphans | A community with no parent is readable by nobody; org admins can still manage it so it can be linked again |
| Creation | `resource_uuid` and `resource_type` (`course` or `podcast`) are required; the resource must belong to the same org, and one community per resource is enforced |
| Management | Follows the parent's authors and org admins |

## Data model

The `community` table stores `org_id`, `community_uuid`, `name`, `description`, `public`, `published`, `thumbnail_image`, `banner_image`, `resource_uuid`, `resource_type`, `source_locale`, `moderation_words` and `moderation_settings`.

- A unique index on `resource_uuid` enforces one community per resource.
- The source-locale name and description live on the base row; other locales live in `community_translation`.
- Discussions, comments, votes and reactions are separate tables managed by their own services.

## API

The router is mounted at `/api/v1/communities` and owns community CRUD, resource linking, rights and media. Discussions live in the [Discussions API](../../06-api-reference/discussions.md). Full request and response contracts are in the [Communities API reference](../../06-api-reference/communities.md).

| Capability | Routes |
|---|---|
| List and read | `GET /communities/org/{org_id}/…`, `GET /communities/{uuid}` |
| Read by parent | `GET /communities/course/{course_uuid}`, `GET /communities/podcast/{podcast_uuid}` |
| Create / update / delete | `POST /communities/?org_id=`, `PUT /communities/{uuid}`, `DELETE /communities/{uuid}` |
| Link / unlink | `PUT /communities/{uuid}/link/{resource_type}/{resource_uuid}`, `DELETE /communities/{uuid}/link` |
| Rights and members | `GET /communities/{uuid}/rights`, member count |
| Media | `PUT/DELETE /communities/{uuid}/thumbnail`, banner equivalents |
| Translations | `GET/PUT/DELETE /communities/{uuid}/translations[/{locale}]` |

Listing filters each row through the access checker, so learners only see communities whose parent they can read; admins and superadmins see everything, including orphans.

## Dashboard

The community editor has five pill tabs:

| Tab | Content |
|---|---|
| General | Name, description, cover and banner media, publish control |
| Access | Read-only explanation of the inherited access, deep-linking to the parent resource's access settings |
| Course | Linked-content tab: pick a course or podcast, search, link or unlink through the generic endpoint |
| Moderation | Word filter, moderation settings and banned words |
| Translations | Name and description per locale, copy-from-source, delete |

Creating a community requires choosing a course or podcast; already-linked parents are disabled. A community can no longer be created standalone.

## Learner surfaces

- `/communities` lists the communities the learner can read, with filters for all, course-linked and podcast-linked.
- `/community/{uuid}` renders the feed; discussions expand inline, so the feed does not navigate to a discussion page.
- The course and podcast detail pages render a recent-discussion section for their linked community.
- The community card shows `Linked Course` / `Linked Podcast` / `Not linked`, and the sidebar links back to the parent.
- Name and description follow the selected locale; discussions stay in the language they were written in.
- Deep links keep the parent gating: API `403` becomes a not-found or "You don't have access" state.

## Related

- [Communities API reference](../../06-api-reference/communities.md)
- [Communities user guide](../../03-user-guide/communities.md)
- [RTL and content localisation](../i18n-rtl/rtl-plan.md)
