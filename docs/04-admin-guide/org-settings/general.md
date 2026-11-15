> Status: as-built · Last verified: 2026-11-15

# General Settings

The General tab holds the organization's identity text and its default language.

## Opening General

Open **Organization → General**. The page uses the same pill tab bar as every organization setting: General, Branding, SEO, Domains, Automations and API Access.

## Fields

| Field | Rule | Effect |
|---|---|---|
| Name | Required, maximum 60 characters | Organization name in the dashboard, titles and organization context |
| Short description | Required, maximum 100 characters | One-line description used by organization surfaces |
| About | Optional, maximum 400 characters | Longer organization description |
| Default language | One language from the available list | Fallback language for the organization's content and interface |

The default language is chosen from an expandable list. The selected language is marked with a check; choosing a language collapses the list. The value is stored in the organization configuration and is used when no per-user language preference applies.

## Saving

The action row contains a three-state save button:

| State | Meaning |
|---|---|
| Save | The form has unsaved changes |
| Saving | The request is in flight |
| Saved | Everything is persisted; the button is inert |

Saving writes the identity fields and the default language together, then revalidates the organization context. Leaving the page with unsaved changes discards them.

There is no logo, favicon, timezone, contact or URL field on this tab; branding images and the theme live under **Branding**, and social/search metadata lives under **SEO**.

## Form behaviour

- Required fields are validated on save and show inline messages.
- Maximum lengths are enforced by the inputs, so typing stops at the limit.
- Saving writes the identity fields first and the default language second. If either request fails, an error toast is shown and the form stays dirty.
- The form reinitialises from the organization context, so a refresh shows the values that were last persisted.

## Related

- [Branding](./branding.md) — logo, favicon, logomark, thumbnail, theme colour, auth screens.
- [SEO](./seo.md) — meta tags, social image, verification and indexing.
- [Organizations API](../../06-api-reference/orgs.md) and [Developer guide](../../05-developer-guide/README.md).
