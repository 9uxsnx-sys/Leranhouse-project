> Status: as-built · Last verified: 2026-11-15

# Getting Started

This page explains how to join an organization site, find content, and understand why some resources are locked.

## Creating an account

The organization decides how people join.

| Signup mode | What you do |
|---|---|
| Open | Open the login page, choose **Sign Up**, and register with your email |
| Invite-only | Open the invite link you received, or enter the invite code on the signup screen |

Invite links look like `/signup?inviteCode=…` and prefill the code. Codes are valid for one year from creation. If you already have an account, opening an invite link adds you to the organization instead of creating a second account.

## Signing in

1. Open the organization's site.
2. Choose **Login**.
3. Enter your email and password.

After sign-in you land on the organization home. The side menu holds Home, Courses, Collections, Communities, Podcasts and Progress; feature-disabled items are absent.

## Understanding access

Every course, podcast and collection has an access mode and a publish state.

| State | What you see |
|---|---|
| Published, `public` | The resource is listed and its content is open |
| Published, `users_only` | The resource is listed only if you belong to a linked user group; otherwise it is hidden |
| Published, `paid` | The full product page is visible; the content needs a purchase |
| Draft | Not shown to learners |

For `paid` courses and collections, the page shows the price and a **Get access** button that opens the Chargily checkout. After payment is confirmed, the resource is added to your account and the button changes to a continue/start action.

For `public` courses the action is **Add to progress**. Collections have their own **Get access** action: it claims a free bundle or starts checkout for a paid bundle. Podcast pages use a **Get access** action that starts the podcast in your trail.

## Progress

The **Progress** page lists enrolled courses.

| Control | Behaviour |
|---|---|
| Search | Filters by course name |
| Status filter | All, In progress, Completed |
| Sort | Newest or oldest enrollment |
| Card action | Opens the course |

Podcasts are tracked in the podcast player and its episode list; they do not appear on the Progress page.

## Account

Your profile menu opens **Account**, which has three tabs: General, Security and Privacy. See [Account](./account.md).

## Help

The help menu links to the documentation, the product site, the community Discord, and a feedback form. Course pages also link to their community when one is attached.

## Related

- [Courses](./courses.md), [Collections](./collections.md), [Podcasts](./podcasts.md)
- [Store](./store.md) and the [Payments API](../06-api-reference/payments.md)
