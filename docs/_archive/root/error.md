## Error Type
Build Error

## Error Message
  x Unexpected token. Did you mean `{'}'}` or `&rbrace;`?

## Build Output
./components/Dashboard/Pages/Course/EditCourseStructure/ModuleForm.tsx
Error:   x Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
     ,-[C:\Projects\learnhouse-dev\learnhouse-dev\apps\web\components\Dashboard\Pages\Course\EditCourseStructure\ModuleForm.tsx:279:1]
 276 |         )}
 277 |       </div>
 278 |   )
 279 | }
     : ^
 280 | 
 281 | export default ModuleForm
     `----
  x Expected '</', got '<eof>'
     ,-[C:\Projects\learnhouse-dev\learnhouse-dev\apps\web\components\Dashboard\Pages\Course\EditCourseStructure\ModuleForm.tsx:281:27]
 279 | }
 280 | 
 281 | export default ModuleForm
     `----

Caused by:
    Syntax Error

Import trace for requested module:
./components/Dashboard/Pages/Course/EditCourseStructure/ModuleForm.tsx
./components/Dashboard/Pages/Course/EditCourseStructure/EditCourseStructure.tsx
./app/orgs/[orgslug]/dash/courses/course/[courseuuid]/[subpage]/page.tsx

Next.js version: 16.3.5 (Webpack)
