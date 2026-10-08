## Error Type
Console ReferenceError

## Error Message
org is not defined


    at PodcastClient (app\orgs\[orgslug]\(withmenu)\podcast\[podcastuuid]\podcast.tsx:179:51)

## Code Frame
  177 |           {podcast.banner_image ? (
  178 |             <img
> 179 |               src={getPodcastBannerMediaDirectory(org?.org_uuid, podcast?.podcast_uuid, podcast?.banner_image)}
      |                                                   ^
  180 |               alt={podcast.name}
  181 |               className="w-full h-full object-cover"
  182 |             />

Next.js version: 16.3.5 (Webpack)
