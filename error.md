error 1 ## Error Type
Console TypeError

## Error Message
Failed to fetch


    at markActivityAsComplete (services/courses/activity.ts:46:31)
    at handleMarkComplete (app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/lesson-preview/page.tsx:591:35)

## Code Frame
  44 |   console.log('[markActivityAsComplete] token present:', !!access_token)
  45 |   try {
> 46 |     const result: any = await fetch(url, {
     |                               ^
  47 |       method: 'POST',
  48 |       headers: {
  49 |         Authorization: `Bearer ${access_token}`,

Next.js version: 16.2.6 (Turbopack)

error 2

## Error Type
Console Error

## Error Message
[markActivityAsComplete] error name: "TypeError"


    at markActivityAsComplete (services/courses/activity.ts:57:13)
    at async handleMarkComplete (app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/lesson-preview/page.tsx:591:7)

## Code Frame
  55 |   } catch (e) {
  56 |     console.error('[markActivityAsComplete] fetch error:', e)
> 57 |     console.error('[markActivityAsComplete] error name:', (e as any)?.name)
     |             ^
  58 |     console.error('[markActivityAsComplete] error message:', (e as any)?.message)
  59 |     console.error('[markActivityAsComplete] error cause:', (e as any)?.cause)
  60 |     throw e

Next.js version: 16.2.6 (Turbopack)


erorr 3

## Error Type
Console Error

## Error Message
[markActivityAsComplete] error message: "Failed to fetch"


    at markActivityAsComplete (services/courses/activity.ts:58:13)
    at async handleMarkComplete (app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/lesson-preview/page.tsx:591:7)

## Code Frame
  56 |     console.error('[markActivityAsComplete] fetch error:', e)
  57 |     console.error('[markActivityAsComplete] error name:', (e as any)?.name)
> 58 |     console.error('[markActivityAsComplete] error message:', (e as any)?.message)
     |             ^
  59 |     console.error('[markActivityAsComplete] error cause:', (e as any)?.cause)
  60 |     throw e
  61 |   }

Next.js version: 16.2.6 (Turbopack)


erorr 4

## Error Type
Console Error

## Error Message
[markActivityAsComplete] error cause: undefined


    at markActivityAsComplete (services/courses/activity.ts:59:13)
    at async handleMarkComplete (app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/lesson-preview/page.tsx:591:7)

## Code Frame
  57 |     console.error('[markActivityAsComplete] error name:', (e as any)?.name)
  58 |     console.error('[markActivityAsComplete] error message:', (e as any)?.message)
> 59 |     console.error('[markActivityAsComplete] error cause:', (e as any)?.cause)
     |             ^
  60 |     throw e
  61 |   }
  62 | }

Next.js version: 16.2.6 (Turbopack)
 