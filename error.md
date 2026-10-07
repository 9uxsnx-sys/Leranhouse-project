## Error Type
Console Error

## Error Message
In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

  ...
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.1, ...}} ...>
      <div className="space-y-8 ..." style={{opacity:0}} ref={function useMotionRef.useCallback}>
        <EditPodcastGeneral orgslug="default">
          <Formik enableReinitialize={true} initialValues={{name:"test...", ...}} validationSchema={{type:"object", ...}} ...>
            <Form>
              <form onSubmit={function} ref={null} onReset={function} action="#">
                <div className="space-y-3">
                  <div>
                  <div>
                  <div className="bg-white r...">
                    <h3>
                    <div className="space-y-4">
                      <div>
                      <div>
                        <label>
                        <div className="space-y-3">
                          <div className="bg-gray-50...">
>                           <button
>                             type="button"
>                             onClick={function onClick}
>                             className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-10..."
>                           >
                              <div>
                              <div className="flex items...">
>                               <button
>                                 type="button"
>                                 onClick={function onClick}
>                                 className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
>                               >
                                ...
                            ...
                          ...
                          ...
                  ...



    at button (<anonymous>:null:null)
    at eval (components\Dashboard\Pages\Podcast\EditPodcastGeneral\EditPodcastGeneral.tsx:354:33)
    at Array.map (<anonymous>:null:null)
    at children (components\Dashboard\Pages\Podcast\EditPodcastGeneral\EditPodcastGeneral.tsx:333:40)
    at EditPodcastGeneral (components\Dashboard\Pages\Podcast\EditPodcastGeneral\EditPodcastGeneral.tsx:167:5)
    at PodcastOverviewPage (app\orgs\[orgslug]\dash\podcasts\podcast\[podcastuuid]\[subpage]\page.tsx:117:17)

## Code Frame
  352 |                             <div className="flex items-center gap-2">
  353 |                               {values.meta_hosts.length > 1 && (
> 354 |                                 <button
      |                                 ^
  355 |                                   type="button"
  356 |                                   onClick={(e) => {
  357 |                                     e.stopPropagation()

Next.js version: 16.3.5 (Webpack)
 
 
 
 
 issues 2

## Error Type
Console Error

## Error Message
<button> cannot contain a nested <button>.
See this log for the ancestor stack trace.


    at button (<anonymous>:null:null)
    at eval (components\Dashboard\Pages\Podcast\EditPodcastGeneral\EditPodcastGeneral.tsx:341:27)
    at Array.map (<anonymous>:null:null)
    at children (components\Dashboard\Pages\Podcast\EditPodcastGeneral\EditPodcastGeneral.tsx:333:40)
    at EditPodcastGeneral (components\Dashboard\Pages\Podcast\EditPodcastGeneral\EditPodcastGeneral.tsx:167:5)
    at PodcastOverviewPage (app\orgs\[orgslug]\dash\podcasts\podcast\[podcastuuid]\[subpage]\page.tsx:117:17)

## Code Frame
  339 |                         >
  340 |                           {/* Header - clickable to expand/collapse */}
> 341 |                           <button
      |                           ^
  342 |                             type="button"
  343 |                             onClick={() => setExpandedHosts(prev => ({ ...prev, [index]: !isOpen }))}
  344 |                             className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100/50 transition-colors"

Next.js version: 16.3.5 (Webpack)
