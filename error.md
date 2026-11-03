## Error Type
Console Error

## Error Message
Podcast not found


    at errorHandling (services\utils\ts\requests.ts:145:24)
    at getPodcastMeta (services\podcasts\podcasts.ts:164:15)
    at Module.generateMetadata$1 (app\orgs\[orgslug]\(withmenu)\podcast\[podcastuuid]\page.tsx:32:19)
    at Next.MetadataOutlet (<anonymous>:null:null)

## Code Frame
  143 |       message = JSON.stringify(detail)
  144 |     }
> 145 |     const error: any = new Error(message)
      |                        ^
  146 |     error.status = res.status
  147 |     error.detail = detail
  148 |     throw error

Next.js version: 16.2.6 (Webpack)


error 2


## Error Type
Console Error

## Error Message
Podcast not found


    at errorHandling (services\utils\ts\requests.ts:145:24)
    at getPodcastMeta (services\podcasts\podcasts.ts:164:15)
    at PodcastPage (app\orgs\[orgslug]\(withmenu)\podcast\[podcastuuid]\page.tsx:120:19)
    at PodcastPage (<anonymous>:null:null)

## Code Frame
  143 |       message = JSON.stringify(detail)
  144 |     }
> 145 |     const error: any = new Error(message)
      |                        ^
  146 |     error.status = res.status
  147 |     error.detail = detail
  148 |     throw error

Next.js version: 16.2.6 (Webpack)
