## Error Type
Console Error

## Error Message
Internal Server Error


    at errorHandling (services\utils\ts\requests.ts:145:24)
    at  getOrgCourses (services\courses\courses.ts:25:15)
    at  CoursesPage (app\orgs\[orgslug]\dash\courses\page.tsx:55:15)

## Code Frame
  143 |       message = JSON.stringify(detail)
  144 |     }
> 145 |     const error: any = new Error(message)
      |                        ^
  146 |     error.status = res.status
  147 |     error.detail = detail
  148 |     throw error

Next.js version: 16.3.5 (Webpack)
