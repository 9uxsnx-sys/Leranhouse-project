## Error Type
Console Error

## Error Message
Each child in a list should have a unique "key" prop.

Check the render method of `Trail`. See https://react.dev/link/warning-keys for more information.


    at AbortErrorSuppressor.useEffect [as error] (components\Providers.tsx:23:28)
    at eval (app\orgs\[orgslug]\(withmenu)\trail\trail.tsx:215:19)
    at Array.map (<anonymous>:null:null)
    at Trail (app\orgs\[orgslug]\(withmenu)\trail\trail.tsx:214:18)
    at TrailPage (app\orgs\[orgslug]\(withmenu)\trail\page.tsx:31:7)

## Code Frame
  21 |         return
  22 |       }
> 23 |       originalConsoleError.apply(console, args)
     |                            ^
  24 |     }
  25 |
  26 |     // Catch unhandled rejections and runtime errors as a fallback.

Next.js version: 16.2.6 (Webpack)

error 2
## Error Type
Console TypeError

## Error Message
Cannot read properties of undefined (reading 'replace')


    at TrailCourseCard (components\Pages\Trail\TrailCourseCard.tsx:23:45)

## Code Frame
  21 |   const session = useLHSession() as any;
  22 |   const access_token = session?.data?.tokens?.access_token;
> 23 |   const courseid = props.course.course_uuid.replace('course_', '')
     |                                             ^
  24 |   const course = props.course
  25 |   const course_total_steps = props.run.course_total_steps
  26 |   const course_completed_steps = props.run.steps.length

Next.js version: 16.2.6 (Webpack)
 