> Status: as-built · Last verified: 2026-11-15

# Account

Account settings have three tabs: General, Security and Privacy. All three are per user, not per organization.

## General

The General tab edits your public profile.

| Field | Notes |
|---|---|
| Username | Unique handle; checked for availability before saving |
| First name | Required display name |
| Bio | Up to 400 characters; a live counter shows what remains |
| Profile picture | JPG or PNG up to 8 MB; cropped to a square before upload |
| Banner | JPG or PNG up to 8 MB; cropped to a 4:1 banner before upload |

Avatar and banner changes upload immediately after cropping. Text fields use the **Save** button at the bottom, which switches between Save, Saving and Saved.

## Security

The Security tab has two rows plus a destructive action.

| Row | Behaviour |
|---|---|
| Email | Shows the current address masked. **Change** opens a modal for the new address; success signs you out so you can sign in again |
| Password | **Change** opens a modal with current password, new password and a live strength indicator. The new password needs at least 8 characters; success signs you out |
| Delete account | Opens a confirmation modal. Type `DELETE` to enable the destructive button; deletion is permanent and signs you out |

Both credential changes sign you out after they succeed, so plan to sign in again.

## Privacy

The Privacy tab controls what appears on your public profile.

| Toggle | Effect |
|---|---|
| Hide courses I own | Your authored courses disappear from your profile |
| Hide podcasts I own | Your authored podcasts disappear from your profile |
| Hide communities I have | Your community memberships disappear from your profile |

Each toggle saves immediately; no Save button is involved. The values are stored in your user metadata.

## Avatar and banner cropping

Selecting a new image opens a crop dialog rather than uploading the file directly.

1. Drag the image to reposition it and use the wheel to zoom.
2. The crop frame is square for the avatar and 4:1 for the banner.
3. Press **Save** in the dialog to upload the cropped result; **Cancel** discards it.

Uploaded images replace the previous file. Use the trash action next to an existing avatar or banner to remove it.

## What is not here

There is no purchases tab, no my-courses tab, no invoice list and no payment-management tab. Paid access is managed through the resource pages, the store and the payment result page; your enrolled courses live on the **Progress** page.

## Related

- [Getting Started](./getting-started.md) — signup and sign-in.
- [Courses](./courses.md) and [Progress](./getting-started.md#progress).
- [Users API](../06-api-reference/users.md) and [Authentication API](../06-api-reference/authentication.md).
