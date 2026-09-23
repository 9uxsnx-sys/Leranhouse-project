# Koodoox — Platform Feature Overview

> **Confidential** — Internal document for marketing team
> **Platform name:** Koodoox (do not refer to any other name)
> **Purpose:** Detailed breakdown of all existing features with real-world scenarios

---

## 1. Platform Overview

Koodoox is a complete learning and community platform that enables organizations to create, manage, and deliver educational content alongside interactive community features. It supports three core content pillars — **Courses**, **Communities**, and **Podcasts** — each with full admin management dashboards, public-facing pages, role-based permissions, and progress tracking.

The platform is built with a modern tech stack (React, Next.js, Medusa UI) and offers both desktop and mobile experiences. It includes SEO optimization, analytics tracking, and integration capabilities.

---

## 2. Core Features

---

### 2.1 Courses

Koodoox's course system is a full-featured learning management platform that covers the entire course lifecycle — from creation and content authoring to delivery, progress tracking, and certification.

#### 2.1.1 Course Creation & Setup

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create from scratch** | Build a course manually by defining name, description, learning outcomes, and tags | A coding bootcamp creates a "Python for Beginners" course by filling out a simple form with course name, description, and key learning goals |
| **Clone courses** | Duplicate an existing course as a starting template | A franchise creates regional variants of a "Customer Service Training" course by cloning the master template and customizing local examples |
| **Course templates** | Reuse successful course structures | A training company creates a standard "Onboarding" course structure and uses it as a template for each new client |

#### 2.1.2 Content Authoring (Course Editor)

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Chapter management** | Create, rename, reorder, and delete chapters with drag-and-drop | An instructor organizes "Web Development 101" into 6 chapters (HTML, CSS, JavaScript, React, Backend, Deployment) and drags to reorder |
| **Drag-and-drop reordering** | Reorder chapters and lessons by dragging | A course creator moves the "Final Quiz" lesson from the last chapter to the middle as a mid-term assessment |
| **Publish/draft toggle** | Each lesson can be in draft or published state independently | An instructor prepares next week's lesson as "draft" while current lessons remain published and visible to students |
| **Lock control per lesson** | Restrict access to specific lessons based on user groups | An advanced module is locked so only "Premium" plan subscribers can access it |
| **Version history** | Track and restore previous versions of any lesson | After accidentally deleting a section, the instructor restores the previous version from the version history |
| **Inline editing** | Edit lesson names, content, and settings directly in the course structure view | A course creator renames "Quiz 1" to "Week 1 Assessment" without opening a separate editor |
| **Bulk operations** | Publish, unpublish, or delete multiple lessons at once | At the end of a semester, a teacher unpublishes all past lessons and publishes the new semester's content in bulk |

#### 2.1.3 Course Curriculum & Display

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Accordion curriculum** | Expandable/collapsible chapter list showing all lessons | A student browses the "Data Science" course and sees 8 chapters, each expandable to show 4-5 lessons |
| **Progress tracking** | Visual checkmarks on completed lessons | A learner sees green checkmarks next to completed lessons and knows exactly where they left off |
| **"What You'll Learn"** | Bullet-pointed learning outcomes displayed on the course page | A "Digital Marketing" course page shows: "Create ad campaigns, Analyze metrics, Optimize ROI, Build brand strategy" |
| **Course requirements** | Prerequisites displayed prominently | A "Machine Learning" course lists: "Python basics, Linear algebra knowledge, Jupyter Notebook setup" |
| **Course includes** | Stats row showing video hours, lessons, knowledge checks, downloadable resources, certificate availability | A student sees "12 hours of video, 45 lessons, 30 knowledge checks, 10 downloadable resources, Certificate included" |
| **Difficulty badges** | Easy, Medium, Hard badges on course cards | A learner filters for "Easy" courses and sees badges on each card for quick scanning |
| **Share functionality** | Share course links to LinkedIn, X/Twitter, Facebook, WhatsApp, Reddit, or copy link | A student shares a great course on their LinkedIn profile with one click |

#### 2.1.4 Learning Experience

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Normal view mode** | Two-column layout: main content + sidebar with course outline and "on this page" navigation | A student reads a lesson with the chapter outline on the right, easily jumping between sections |
| **Focus mode** | Fullscreen immersive reading with minimal distractions | A student preparing for exams switches to focus mode to concentrate solely on the lesson content |
| **Mark as complete** | Check off lessons as finished; auto-advances to next lesson | After finishing a reading, a student clicks "Mark as Complete" and is taken to the next lesson |
| **Previous/Next navigation** | Navigate between lessons with persistent buttons | A learner clicks "Next" to move from "Introduction" to "Chapter 1: Getting Started" |
| **Locked state** | Shows lock screen for restricted content with auth or access messages | A free-tier user sees a lock icon and "Upgrade to access this lesson" when trying to view premium content |
| **Course end view** | Dedicated completion page shown when all lessons are done | After finishing the last lesson, a student sees a "Congratulations — Course Complete!" page with certificate information |
| **Knowledge checks** | Q&A accordion cards for self-assessment | A "Cybersecurity" course includes "Quick Check" questions at the end of each chapter: "What is a phishing attack?" with expandable answers |
| **Downloadable resources** | Resource links attached to lessons | A "Photography" course provides downloadable Lightroom presets and cheat sheets alongside each lesson |
| **Key takeaways** | Summary section at the end of each lesson | Each lesson in a "Business Strategy" course ends with "3 Key Takeaways" for quick review |
| **Up next** | Preview of the following lesson | At the bottom of "Understanding CSS Grid," a card shows "Up Next: CSS Flexbox — A Complete Guide" |

#### 2.1.5 Progress & Trail Tracking

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Start course** | Begin a course and create a learning trail | A student clicks "Start Course" on a "JavaScript Fundamentals" course, creating a personalized progress trail |
| **Lesson completion** | Mark individual lessons as done/un-done | A student marks a video lesson as complete after watching, or un-marks it if they want to rewatch |
| **Progress percentage** | Visual progress bar on course sidebar and dashboard cards | A student sees "60% complete" on their dashboard for the "React for Beginners" course |
| **Trail dashboard** | Central dashboard showing all enrolled courses with progress | A learner logs in and sees all 5 courses they're taking, each with a progress bar and last-accessed timestamp |
| **Quit course** | Remove a course from your trail | A student decides the "Advanced Physics" course is too difficult and removes it from their trail |
| **Certificate on completion** | Certificate eligibility when 100% of lessons are marked complete | After finishing all 30 lessons, a student receives a "Python Programming — Certificate of Completion" |

#### 2.1.6 Course Discovery & Listing

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Search courses** | Full-text search across course names and descriptions | A user types "machine learning" and sees all matching courses with highlighted results |
| **Difficulty filter** | Filter by Easy, Medium, Hard | A beginner selects "Easy" to find introductory courses suitable for their level |
| **User group filter** | Filter courses by personal/family plan access | A premium subscriber filters to see only courses included in their plan |
| **Responsive grid** | 1-4 column grid adapting to screen size | On a phone, courses appear in a single column; on a desktop monitor, 4 columns are shown |
| **Pagination** | Page navigation with smart ellipsis for large result sets | A catalog with 50 courses shows pages 1-5 with "..." for quick jumping |
| **Empty states** | Distinct messages for "no search results" vs "no courses available" | A search for "quantum astrology" shows "No courses match your search. Try different keywords." |

#### 2.1.7 Course Updates & Announcements

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create updates** | Admins can post course announcements (title + content) | A course instructor posts: "New video added — Chapter 4: Advanced Topics now includes a bonus lecture" |
| **Delete updates** | Remove outdated announcements | After the semester ends, the instructor removes old announcements to keep the course page clean |
| **Timeline display** | Updates shown in chronological order with relative timestamps | Students see "New lesson posted — 2 hours ago" and "Course materials updated — 3 days ago" |

#### 2.1.8 Course Management Dashboard

| Feature | Description | Real-World Scenario |
|---|---|---|
| **7-tab editor** | General, Content, Access, Contributors, SEO, Certification, Analytics | A course admin switches between tabs to edit different aspects of the course |
| **Publish/unpublish toggle** | One-click publish/unpublish from the editor header | A course creator finishes editing and clicks "Publish" to make the course live |
| **Access control** | Set courses as Public or Users Only with user group restrictions | An enterprise sets internal training courses to "Users Only" so only employees can access them |
| **Contributor management** | Add, remove, and assign roles (CREATOR, MAINTAINER, CONTRIBUTOR, REPORTER) | A team of 3 instructors works on a course: one CREATOR, one MAINTAINER, and one CONTRIBUTOR |
| **Bulk contributor operations** | Add or remove multiple contributors at once | A department head adds 5 new instructors to all department courses in one action |
| **SEO settings** | Custom title, description, keywords, canonical URL, Open Graph, Twitter Card, robots meta | An SEO specialist optimizes the course page for Google search results with custom meta tags |
| **Certification settings** | Enable certificates, choose design pattern (10 options), set instructor name | A university enables certificates for "Business Law 101" with a "Professional" certificate design and the professor's name |
| **Analytics (Pro)** | Course performance analytics (requires pro plan) | A training manager reviews course completion rates and drop-off points to improve content |

#### 2.1.9 Course Import/Export

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Export single course** | Download a course as a ZIP file | An instructor backs up their "Photography Masterclass" course before major edits |
| **Batch export** | Export multiple courses at once | A training company exports all 20 of their courses for a client delivery |
| **Analyze import package** | Preview what a ZIP contains before importing | Before importing, an admin sees the course structure to verify it's the right package |
| **Import courses** | Restore courses from ZIP files | After migrating servers, an admin imports all previously exported courses |

#### 2.1.10 Course Roles & Permissions

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Creator** | Full ownership — edit, delete, manage contributors, manage access | The original course author has full control and can delete the course if needed |
| **Maintainer** | Edit content, manage settings, but cannot delete | A teaching assistant can update lesson content and manage students but cannot delete the course |
| **Contributor** | Edit content only | A guest lecturer can add their specific module but cannot change course settings |
| **Reporter** | View-only access with reporting capabilities | A department head can view course content and generate reports without making changes |
| **Apply for contributor** | Users can apply to become contributors | An expert in the field applies to contribute to a course and the admin approves |
| **Bulk add/remove** | Add or remove contributors in bulk | At the start of a semester, an admin adds all new TAs as contributors to relevant courses |

---

### 2.2 Communities

Koodoox's community system provides a full-featured discussion forum platform where members can create discussions, comment, vote, react, and organize conversations by category. Communities can be linked to courses for integrated learning + discussion experiences.

#### 2.2.1 Community Creation & Management

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create community** | Set up a community with name, description, public/private visibility | A "Python Developers" community is created with a public setting so anyone can join and participate |
| **Public/private toggle** | Control visibility — public communities are discoverable, private ones require access | A company creates a private "Internal IT Support" community only accessible to employees |
| **Link to course** | Associate a community with a specific course for integrated discussions | The "Data Science Bootcamp" course has a linked community where students discuss homework and share resources |
| **Unlink from course** | Remove the association between community and course | After the bootcamp ends, the community is unlinked from the course but remains accessible for alumni |
| **Moderation settings** | Configure block words, link blocking, post length limits, slow mode, rate limits | A large community blocks certain keywords, limits posts to 5000 characters, and enables slow mode (1 post per 5 minutes) to prevent spam |
| **Update thumbnail** | Upload or change the community cover image | A community manager updates the thumbnail to match a new branding campaign |
| **Delete community** | Permanently remove the community and all its discussions | An inactive community is deleted to clean up the organization's community list |

#### 2.2.2 Discussions

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create discussion** | Post a new topic with title, content (rich text), label, and optional emoji | A member of the "UX Design" community creates a discussion titled "Best tools for prototyping in 2026?" with a 💡 emoji and the "question" label |
| **Rich text editor** | TipTap/ProseMirror editor with Bold, Italic, Strikethrough, Code, Headings, Lists, Blockquotes, Links | A user writes a detailed guide with formatted headings, bullet lists, and embedded links to resources |
| **Labels/categories** | 5 label types: General, Q&A, Ideas, Announcements, Showcase — each with distinct colors | A "Q&A" discussion about a technical issue is easily identifiable with its amber label |
| **Emoji picker** | Choose an emoji for the discussion title from 6 categories (Smileys, Gestures, Hearts, Objects, Nature, Food) | A community member adds a 🎉 emoji to their "New feature request" discussion to grab attention |
| **Edit discussion** | Edit title, content, label, or emoji (max 2 edits tracked) | A user realizes they made a typo in their discussion title and edits it, with a small "edited" indicator shown |
| **Delete discussion** | Remove a discussion (author or admin) with confirmation modal | A moderator removes a spam discussion that violates community guidelines |
| **Pin discussion** | Stick important discussions to the top (admin feature) | A community manager pins "Welcome — Read This First" and "Community Rules" so they're always visible |
| **Lock discussion** | Prevent new comments on a discussion (admin feature) | An outdated announcement is locked to prevent new comments while keeping it visible for reference |
| **Upvote discussions** | Upvote/downvote discussions with optimistic UI updates | A helpful "How to install Docker" discussion gets 47 upvotes, rising to the top when sorted by "Top" |
| **Search discussions** | Full-text search across discussion titles and author names | A user types "deployment" and finds all discussions mentioning deployment in their title or content |
| **Filter by label** | Filter the discussion list by specific label categories | A developer clicks the "Q&A" filter to see only technical questions, ignoring general chat |
| **Sort options** | Sort by Latest Activity, Top (upvotes), or Hot | A user sorts by "Hot" to see the most active discussions right now |
| **Select mode (bulk)** | Batch select discussions for bulk operations | A moderator selects 10 spam discussions and deletes them all at once |

#### 2.2.3 Comments

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create comments** | Reply to any discussion with plain text | A user replies to a "Best IDE for Python?" discussion with "I recommend VS Code with the Python extension" |
| **Inline editing** | Edit your comment with Save/Cancel, Ctrl+Enter to save | A user corrects a code example in their comment by editing it inline |
| **Delete comments** | Remove your own comment or as a moderator | A user deletes a comment they accidentally posted twice |
| **Upvote comments** | Upvote individual comments within a discussion | A particularly helpful answer in a Q&A thread gets 30 upvotes |
| **Comment count** | Display number of comments on each discussion card | A discussion with 15 replies shows "15" next to the comment icon, indicating active conversation |
| **Locked discussion state** | Shows "This discussion is locked" banner when comments are disabled | Users trying to comment on an archived discussion see a clear message that commenting is closed |
| **Keyboard shortcuts** | Ctrl+Enter / Cmd+Enter to submit comment | A power user types their reply and hits Cmd+Enter to post without clicking the submit button |

#### 2.2.4 Reactions

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Emoji reactions** | React to discussions with emojis (10 common emojis available) | Community members react to a "New Release Announcement" with 👍 🎉 ❤️ |
| **Reaction toggle** | Click to add or remove your reaction | A user who accidentally reacted with 👍 clicks again to remove it |
| **Reaction counts** | See how many people used each emoji | A post shows "👍 12 🎉 8 ❤️ 5" so the author knows the most popular reaction |
| **User tooltips** | Hover over a reaction to see who reacted | Hovering over 👍 shows "Alice, Bob, Charlie, Diana and 8 others" |
| **Add reaction picker** | Popover grid to choose from 10 common emojis | A user clicks the "+" reaction button and selects 🚀 from the emoji grid |

#### 2.2.5 Community Sidebar & Info

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Community info card** | Shows thumbnail, name, public/private badge, description | A visitor sees the "Photography Enthusiasts" community card with its camera icon thumbnail and "Public" green badge |
| **Stats display** | Discussion count, creation date | Members see "247 discussions" and "Created 8 months ago" in the sidebar |
| **Linked course card** | If linked to a course, shows a clickable course card with thumbnail | A "JavaScript Basics" community sidebar shows a linked "JavaScript for Beginners" course card |
| **Quick tips** | Static community guidelines section | A sidebar displays "Be respectful, Stay on topic, No spam, Have fun!" as community guidelines |

#### 2.2.6 Discussion Detail Page

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Full discussion view** | Shows title with emoji, rich content, author info, and comments | A user opens a discussion and sees the full formatted post with all comments below |
| **Author sidebar** | Desktop left sidebar with author avatar, upvotes, label, status badges | A desktop user sees the discussion author's profile, the Q&A label badge, and pinned/locked status |
| **Reactions card** | Emoji reactions with counts in the sidebar | In the sidebar, users see 👍 12 🎉 8 and can add their own reaction |
| **Community back-link** | Link back to the main community page | A user reading a discussion can click "Back to Photography Community" to return to the discussion list |
| **Breadcrumbs** | Navigable breadcrumb trail (Communities > Community Name > Discussion Title) | A user navigates: Communities > Python Developers > "How do I install pip?" |

#### 2.2.7 Course-Community Integration

| Feature | Description | Real-World Scenario |
|---|---|---|
| **CourseCommunitySection** | Displays a course's linked community on the course page | A student on the "Web Development" course page sees a "Community Discussions" section showing recent posts |
| **Recent discussions widget** | Shows last 3 discussions from the linked community | On the course page, a student sees "3 recent discussions from the community" with titles and author names |
| **"View all" link** | Quick link to the full community from the course page | A student clicks "View all discussions" to go from the course page to the full community forum |
| **"Start discussion" CTA** | Empty state prompt to create the first discussion | A newly linked community with no discussions shows "No discussions yet — Start the first discussion!" |

#### 2.2.8 Community Roles & Permissions

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Admin** | Full access — create, read, update, delete discussions and comments, manage community settings | The community creator can pin discussions, lock threads, delete any content, and edit community settings |
| **Maintainer** | Moderate content (edit/delete any discussion or comment), but cannot change community settings | A trusted community member is promoted to maintainer to help moderate discussions |
| **Member (org member)** | Create discussions, comment, upvote, react | An organization member joins the "Design Team" community and can participate in all discussions |
| **Read-only (public)** | View discussions and comments, cannot interact | A visitor browsing a public community can read all content but needs to sign up and join to participate |
| **Create discussion permission** | Controlled by `create_discussion` right | Some communities restrict "who can post" to maintainers only, with members only able to comment |
| **Access control** | Via public visibility or user group restrictions | A private "Executive Board" community is only accessible to users in the "executive" user group |

---

### 2.3 Podcasts

Koodoox's podcast system allows organizations to create, manage, and distribute audio content with a full podcast player, episode management, RSS feed distribution, and public-facing podcast pages.

#### 2.3.1 Podcast Creation & Management

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create podcast** | Set up a podcast with name, description, thumbnail, tags, and visibility settings | A "Tech Talk Weekly" podcast is created with a logo thumbnail, description "Weekly discussions on the latest in tech," and set to public |
| **Public/private toggle** | Control visibility — public podcasts are discoverable, private ones require access | An internal "Company Updates" podcast is set to private so only employees can listen |
| **Published/unpublished** | Draft mode vs live mode | A podcast team prepares 3 episodes in unpublished draft mode, then publishes all at once on launch day |
| **Tags** | Add descriptive tags for searchability | A "Data Science Today" podcast adds tags: "data-science, machine-learning, AI, python, analytics" |
| **Update thumbnail** | Upload or change podcast cover art | The podcast updates its cover art to match a new season's branding |
| **Delete podcast** | Permanently remove podcast and all episodes | An inactive podcast is removed to clean up the organization's content library |
| **RSS feed** | Auto-generated RSS feed URL for distribution to podcast directories | The podcast's RSS feed URL is used to submit to Apple Podcasts, Spotify, and other directories |

#### 2.3.2 Episode Management

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Create episode** | Add a new episode with title, description, audio file upload, thumbnail, and episode number | A new episode "Episode 47: The Future of AI" is created with an MP3 file, show notes in the description, and episode number 47 |
| **Upload audio** | Upload audio files (MP3, etc.) for each episode | A podcaster uploads a 45-minute interview recording as the episode audio |
| **Episode thumbnail** | Per-episode custom thumbnail (falls back to podcast thumbnail) | A special guest episode has a custom thumbnail featuring the guest's photo |
| **Publish/draft toggle** | Control individual episode visibility | An episode is recorded but needs editing, so it stays in "draft" mode until ready |
| **Reorder episodes** | Drag-and-drop reordering of episodes | After releasing a special episode out of order, the podcaster reorders episodes to maintain chronological flow |
| **Delete episode** | Remove an episode from the podcast | An episode with incorrect information is deleted |
| **Edit episode** | Update title, description, or replace audio file | A typo in the episode description is corrected after publishing |
| **In-page audio preview** | Preview audio directly in the dashboard without opening the public player | An editor clicks play on an episode row in the dashboard to quickly verify the audio before publishing |

#### 2.3.3 Public Podcast Experience

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Podcast detail page** | Dedicated page with episodes feed, search, and sidebar | A listener visits the "Tech Talk Weekly" page and sees all episodes listed chronologically |
| **Episode feed** | Chronological list of all episodes with titles, descriptions, durations | A user browses through 50 episodes, reading descriptions to find topics they're interested in |
| **Search episodes** | Full-text search across episode titles and descriptions | A listener types "blockchain" and finds all episodes that discuss blockchain technology |
| **Sort episodes** | Sort by Latest, Oldest, or Duration | A user sorts by "Duration" to find shorter episodes for their commute |
| **Episode cards** | Each episode shows: number, thumbnail, title, description (2-line clamp), duration with clock icon | A listener scans the episode list and sees "Ep 12: Understanding React Hooks — 34 min" |
| **Unpublished badge** | Yellow badge on unpublished episodes for admins viewing the public page | An admin previewing the public page sees which episodes are not yet live with clear "Unpublished" badges |
| **Episode count** | Total episode count displayed | New visitors see "47 episodes" and know the podcast has substantial content |
| **Total duration** | Combined duration of all episodes | The page shows "Total: 28 hours" giving visitors a sense of the content volume |
| **Empty states** | Distinct states for "no episodes" vs "no search results" | A new podcast with no episodes shows "No episodes yet" with a headphones icon; a search with no matches shows "No episodes match your search" |

#### 2.3.4 Podcast Player

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Fixed bottom player** | Persistent audio player at the bottom of the screen | A user browses the website while the podcast continues playing in the fixed player bar |
| **Minimized mode** | Compact player (h-16) showing minimal controls | While reading other content, the player shrinks to a small bar showing only current time and play/pause |
| **Expanded mode** | Full player (h-24) with waveform, volume control, skip buttons | A user clicks expand to see the waveform visualization and access volume controls |
| **WaveSurfer visualization** | Audio waveform displayed in both minimized and expanded modes | A user sees the audio waveform and can click anywhere on it to seek to that position |
| **Play/Pause** | Core playback control | A user presses pause to answer a phone call, then resumes where they left off |
| **Skip forward/backward** | Skip 15 seconds forward or backward (expanded mode) | A listener skips back 15 seconds to rehear an important point the speaker just made |
| **Volume control** | Mute/unmute toggle + range slider (expanded mode) | A user mutes the player to hear a notification, then unmutes at the same volume level |
| **Current time + duration** | Display of elapsed time and total duration | A listener sees "23:45 / 45:30" to know how much of the episode is left |
| **Episode info** | Shows currently playing episode title and podcast name | A user sees "Ep 47: The Future of AI — Tech Talk Weekly" in the player |
| **Thumbnail display** | Episode or podcast thumbnail shown in the player | The player shows the episode's custom thumbnail for visual identification |
| **Close player** | Dismiss the player entirely | After finishing listening, a user closes the player to reclaim screen space |
| **Mute memory** | Remembers previous volume when unmuting | A user mutes at 70% volume, then unmutes — volume returns to 70%, not 100% |

#### 2.3.5 Podcast Player State (Context)

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Persistent state** | Player state persists across page navigation | A user starts an episode on the podcast page, navigates to a course page, and the episode continues playing |
| **Play episode** | Start playing any episode from any podcast | A user clicks "Play" on an episode card and it immediately starts in the player |
| **Track current time** | Real-time playback position tracking | The player accurately shows "34:12 / 45:00" as the episode plays |
| **Auto-pause on end** | Episode stops when finished | When an episode ends, the player stops and shows the completed state |
| **Minimize/maximize** | Toggle between compact and expanded views | A user minimizes the player to a small bar to focus on reading course content |

#### 2.3.6 Podcast Distribution

| Feature | Description | Real-World Scenario |
|---|---|---|
| **RSS feed URL** | Auto-generated RSS feed for podcast distribution | The podcast's RSS feed is submitted to Apple Podcasts, Spotify, Amazon Music, and YouTube Music |
| **Copy RSS link** | One-click copy of RSS feed URL | A podcaster copies the RSS URL and pastes it into Apple Podcasts Connect |
| **Preview RSS** | Open RSS feed in browser to verify XML output | Before submitting to directories, the podcaster previews the RSS XML to ensure all episode data is correct |
| **Submission guides** | Step-by-step instructions for Apple Podcasts, Spotify, YouTube Music, Amazon Music | A new podcaster follows the built-in guide to submit their show to all major platforms |

#### 2.3.7 Podcast Discovery & Listing

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Podcast grid** | Responsive card grid (1-4 columns) showing all podcasts | A visitor sees all organization podcasts laid out in a clean grid |
| **Search podcasts** | Search by name, description, and tags | A user types "technology" and finds all tech-related podcasts |
| **Visibility filter** | Filter by All, Public, or Private podcasts | An admin filters to see only private podcasts that need review |
| **Pagination** | 12 podcasts per page with smart page navigation | An organization with 30 podcasts shows pages 1-3 with "..." for quick access |
| **Podcast cards** | Each card shows: thumbnail, title (2-line clamp), description (3-line clamp), episode count, duration, relative date | A user browses the grid and sees "Tech Talk Weekly — 47 episodes — Updated 2 days ago" |

#### 2.3.8 Podcast Dashboard (Admin)

| Feature | Description | Real-World Scenario |
|---|---|---|
| **3-tab editor** | General, Episodes, Distribution | A podcast manager switches between editing settings, managing episodes, and finding distribution info |
| **General tab** | Edit name, description, about, tags, thumbnail, visibility, publish status | A podcaster updates the podcast description for the new season and toggles visibility to public |
| **Episodes tab** | Full episode list with drag-reorder, create/edit/delete/publish episodes | A podcast producer creates a new episode, uploads audio, and publishes it — all from one tab |
| **Distribution tab** | RSS feed info + submission guides for major directories | A podcaster copies the RSS link and follows the step-by-step Spotify submission guide |
| **Create podcast** | Modal with name, description, public toggle | A content manager creates a new "Interview Series" podcast in under 30 seconds |

#### 2.3.9 Podcast Roles & Permissions

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Admin/Creator** | Full control — create, edit, delete podcast and episodes, manage settings | The podcast owner manages all aspects of the show |
| **Contributor** | Can edit content (episodes) but cannot delete podcast or change settings | A guest host can upload and edit their episodes but cannot change podcast settings or delete the show |
| **Viewer (public)** | Can view public podcasts and play episodes | Any visitor can browse and listen to public podcast episodes |
| **Viewer (private)** | Requires authentication and access rights to view private podcasts | Only organization members can access internal "Company News" podcast |
| **Create permission** | Controlled by user role — only users with "create" permission on podcasts can create new ones | Only content managers see the "New Podcast" button in the dashboard |
| **Update permission** | Required to edit podcast settings and episode content | A contributor can upload episodes but cannot edit the podcast name or description |
| **Delete permission** | Required to delete podcast or episodes | Only the podcast owner can delete the entire podcast |

## 4. Platform Infrastructure

Koodoox is built on a modern, production-ready tech stack designed for scalability, performance, and ease of deployment. The platform supports both self-hosted (open-source) and cloud-managed deployments.

---

#### 4.1 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Next.js 14 (React) + TypeScript | Server-side rendering, static generation, App Router, and full TypeScript support across the entire frontend. |
| **UI Framework** | Medusa UI + Tailwind CSS | Consistent design system with reusable components (Container, Heading, Text, Badge, Button) and utility-first styling. |
| **Backend** | FastAPI (Python) | Async Python backend with automatic OpenAPI documentation, Pydantic validation, and SQLModel ORM. |
| **Database** | PostgreSQL + pgvector | Relational database with vector extension for similarity search and embedding storage. |
| **Caching** | Redis | In-memory caching for auth tokens, rate limiting, analytics queries, and real-time collaboration state. |
| **Real-time** | Hocuspocus + Yjs (WebSocket) | CRDT-based real-time collaboration for collaborative documents and boards. |

---

#### 4.2 Architecture

| Aspect | Description |
|---|---|
| **Monorepo structure** | Single repository containing API (Python/FastAPI), Web (Next.js), Collab (Node.js/Hocuspocus), Medusa (ecommerce), and MCP (integration server) — all managed with shared tooling. |
| **RESTful API** | Fully documented REST API with auto-generated OpenAPI/Swagger docs, pagination, filtering, and consistent error responses. |
| **Cookie-based auth** | JWT authentication with refresh token rotation stored in HTTP-only cookies for security. |
| **Modular provider system** | Plug-and-play providers for payments (Stripe), auth (Google, GitHub, WorkOS), storage (S3, local), and email (Resend, SMTP). |
| **Event-driven webhooks** | Async webhook dispatch with HMAC signing, retry logic, delivery logging, and SSRF protection. |

---

#### 4.3 Deployment Options

| Option | Description |
|---|---|
| **Self-hosted (open-source)** | Full platform can be deployed on your own infrastructure. Supports Docker Compose for single-server setups or Kubernetes for production-scale deployments. |
| **Koodoox Cloud (managed)** | Fully managed cloud version with automatic updates, backups, scaling, and monitoring. No infrastructure management required. |
| **Hybrid** | Choose which services to self-host (e.g., self-host the API + database while using Koodoox Cloud for media storage and analytics). |

---

#### 4.4 Mobile Experience

| Feature | Description |
|---|---|
| **Responsive design** | All pages are fully responsive — courses, communities, and podcasts adapt seamlessly from mobile to desktop with a consistent two-column layout pattern. |
| **Mobile-first navigation** | Bottom navigation bar on mobile, sidebar navigation on desktop. Touch-friendly interactions throughout. |
| **Progressive Web App** | Built as a PWA-ready application with offline capabilities and install-to-home-screen support. |

---

#### 4.5 Performance & SEO

| Feature | Description |
|---|---|
| **Server-side rendering** | Course pages, community discussions, and podcast episodes are SSR-rendered for fast initial load and full SEO indexing. |
| **SEO meta tags** | Custom Open Graph, Twitter Card, canonical URLs, and robots meta settings per course and per page. |
| **Image optimization** | Automatic image resizing, WebP conversion, and lazy loading via Next.js Image component. |
| **Incremental Static Regeneration** | Frequently accessed content (course pages, community listings) is statically generated and incrementally updated. |
| **CDN-ready** | Static assets and media files can be served through any CDN for global low-latency delivery. |

---

#### 4.6 Security

| Feature | Description |
|---|---|
| **SSRF protection** | Two-phase SSRF guard — DNS resolution + IP validation before connect, peer verification after connect to prevent DNS rebinding attacks. |
| **Rate limiting** | Per-user and per-organization rate limiting across all API endpoints. |
| **Input validation** | Pydantic model validation on all API inputs. XML parsing protected by defusedxml. |
| **Webhook security** | HMAC-SHA256 signed payloads with Fernet-encrypted secrets. |
| **Password hashing** | Argon2 — industry-standard password hashing algorithm. |
| **CORS & CSP** | Configurable CORS policies and Content Security Policy headers. |

---

#### 4.7 Scalability

| Aspect | Description |
|---|---|
| **Horizontal scaling** | API and frontend are stateless and can be horizontally scaled behind a load balancer. |
| **Database** | PostgreSQL with connection pooling, read replicas support, and Alembic migrations for schema management. |
| **Caching layer** | Redis reduces database load for frequently accessed data — auth tokens, analytics, rate limiting. |
| **Media storage** | S3-compatible storage decouples file serving from application servers. |
| **Background tasks** | Async task processing for webhooks, email delivery, and analytics ingestion. |

---

## 5. Coming Up Next

### 5.1 Admin AI Assistant

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Analytics & insights** | Ask any question about your platform data — enrollments, completion rates, user activity — and get instant answers | An admin asks *"How many people enrolled last month and which course has the highest completion rate?"* — the AI pulls the data and gives a clear answer in seconds |
| **Lesson content generation** | Generate full lesson content (summary, key takeaways, knowledge checks, resources) from a video — saves as draft for approval | Sarah uploads a "Understanding APIs" video and asks the AI to create the lesson content. The AI generates everything in seconds; Sarah reviews and approves. Saves 30 minutes per lesson. |
| **Admin actions** | Invite users, publish courses, manage roles, and trigger platform actions through natural language | An admin says *"Invite john@company.com as an instructor and publish the Advanced Python course"* — the AI handles both actions instantly |
| **Course planning** | Describe a course idea and get a full outline with chapters and lessons, then finalize it into the platform | A training manager describes a "Sales Techniques" course idea and the AI generates a 6-chapter outline ready to be built out |

### 5.2 Mobile App

| Feature | Description | Real-World Scenario |
|---|---|---|
| **Offline learning** | Download courses, videos, and resources to your phone and learn without internet | Mark downloads a "Negotiation Skills" course before his commute. On the train with no signal, he watches lessons and answers quizzes. Progress syncs when he gets online. |
| **Background audio** | Listen to podcast episodes with the phone locked or while using other apps | On his evening run, Mark listens to a podcast episode in the background with playback speed controls and lock screen controls |
| **Picture-in-Picture video** | Watch lessons in a small floating window while taking notes or using other apps | A student watches a coding tutorial in a small window while following along in their code editor |
| **Push notifications** | Get notified of new lessons, discussion replies, mentions, and certificate achievements | A learner gets a push notification: *"New lesson available: Advanced CSS Grid"* — taps it and opens directly to the lesson |
| **Biometric login** | Unlock the app with Face ID or fingerprint | A student opens the app and logs in with their fingerprint in under a second — no password typing |
| **Native sharing** | Share course links to any app (WhatsApp, iMessage, LinkedIn, etc.) with the native share sheet | After finishing a course, a learner taps share and sends the course link to their team via WhatsApp with one tap |

## 6. Project Cost Breakdown

Below is a professional agency-style estimate of the cost to build the Koodoox platform from scratch, based on real market data from multiple agencies in 2025-2026.

> **Note:** All prices are estimated ranges. Actual costs vary by team location, seniority, and requirements.

| Item | Estimated Cost |
|---|---|
| **Discovery & planning** — Requirements, UX research, technical architecture | $2,000 — $3,000 |
| **Design (UI/UX)** — Design system, wireframes, high-fidelity mockups, prototype | $6,000 — $9,000 |
| **Frontend development** — Next.js, auth UI, course/community/podcast UIs, admin dashboard, responsive design | $22,000 — $28,000 |
| **Backend development** — FastAPI, auth, course/community/podcast APIs, analytics, webhooks, AI, real-time collab | $18,000 — $24,000 |
| **Content editor & media** — TipTap editor, media upload/streaming, course import/export | $5,000 — $7,000 |
| **Infrastructure & DevOps** — Cloud setup, CI/CD, database, monitoring, security | $4,000 — $6,000 |
| **Testing & QA** — Manual QA, automated tests, performance testing | $4,000 — $6,000 |
| **Project management & docs** — Sprint management, technical docs, user guides | $3,000 — $5,000 |
| **Total build cost** | **$64,000 — $88,000** |


