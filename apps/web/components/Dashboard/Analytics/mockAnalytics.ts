/**
 * Mock data for the analytics tabs.
 *
 * Phase 4 uses static data so the layout can be reviewed in place; Phase 5 replaces
 * these exports with real API/SQL queries (see docs/08-features/analytics/overview.md).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const activityTrend = [
  320, 372, 356, 410, 448, 432, 486, 520, 498, 556, 602, 648,
].map((learners, i) => ({
  label: MONTHS[i],
  learners,
  signups: [48, 55, 51, 63, 71, 66, 80, 88, 79, 94, 103, 112][i],
}))

export const enrollmentsTrend = [
  210, 240, 228, 275, 302, 289, 330, 361, 344, 388, 421, 455,
].map((value, i) => ({ label: MONTHS[i], value }))

export const revenueTrend = [
  118000, 132000, 126500, 151000, 168000, 159500, 184000, 201000, 193500, 219000, 238000, 256500,
].map((revenue, i) => ({ label: MONTHS[i], revenue }))

export const trafficTrend = [
  15200, 16400, 15800, 18600, 20200, 19400, 21800, 23600, 22800, 25400, 27600, 29800,
].map((visits, i) => ({
  label: MONTHS[i],
  visits,
  visitors: Math.round(visits * [0.62, 0.61, 0.64, 0.63, 0.62, 0.65, 0.64, 0.63, 0.66, 0.64, 0.65, 0.67][i]),
}))

export const discussionsTrend = MONTHS.map((label, i) => ({
  label,
  discussions: [42, 48, 51, 60, 57, 66, 71, 68, 79, 85, 92, 103][i],
  comments: [180, 210, 232, 268, 250, 291, 318, 305, 356, 392, 431, 486][i],
}))

export const enrollmentFunnel = [
  { label: 'Course views', value: 12400 },
  { label: 'Enrollments', value: 3200 },
  { label: 'Started learning', value: 2450 },
  { label: 'Completed', value: 1120 },
]

export const checkoutFunnel = [
  { label: 'Course views', value: 8600 },
  { label: 'Checkout started', value: 1420 },
  { label: 'Payment success', value: 1088 },
]

export const lessonFunnel = [
  { label: 'Lesson 1', value: 3200 },
  { label: 'Lesson 2', value: 2480 },
  { label: 'Lesson 3', value: 1890 },
  { label: 'Lesson 4', value: 1320 },
  { label: 'Lesson 5', value: 910 },
]

export const topCourses = [
  { name: 'Python for Beginners', value: 842 },
  { name: 'Web Design Basics', value: 654 },
  { name: 'Advanced React', value: 521 },
  { name: 'Data Analysis 101', value: 438 },
  { name: 'Marketing Essentials', value: 372 },
  { name: 'SQL Fundamentals', value: 311 },
]

export const salesByCourse = [
  { name: 'Python for Beginners', value: 184000 },
  { name: 'Advanced React', value: 142000 },
  { name: 'Web Design Basics', value: 118000 },
  { name: 'Data Analysis 101', value: 96500 },
  { name: 'SQL Fundamentals', value: 64000 },
]

/** Per-course completion rate (%) — one value per course. */
export const completionRanked = [
  { name: 'Python for Beginners', value: 78 },
  { name: 'Web Design Basics', value: 71 },
  { name: 'Advanced React', value: 64 },
  { name: 'Data Analysis 101', value: 58 },
  { name: 'Marketing Essentials', value: 46 },
  { name: 'SQL Fundamentals', value: 39 },
]

/** Course starts vs completions, per period. */
export const learningTrend = [210, 240, 228, 275, 302, 289, 330, 361, 344, 388, 421, 455].map(
  (starts, i) => ({
    label: MONTHS[i],
    starts,
    completions: [92, 108, 99, 126, 141, 132, 156, 172, 160, 187, 205, 224][i],
  })
)

/** Completion effectiveness (%) by content type. */
export const contentTypeEffectiveness = [
  { name: 'Video', value: 68 },
  { name: 'Quiz', value: 74 },
  { name: 'Reading', value: 52 },
  { name: 'Assignment', value: 61 },
]

export const completionByCourse = [
  { label: 'Jan', python: 64, react: 58 },
  { label: 'Feb', python: 66, react: 60 },
  { label: 'Mar', python: 63, react: 61 },
  { label: 'Apr', python: 68, react: 64 },
  { label: 'May', python: 70, react: 66 },
  { label: 'Jun', python: 69, react: 65 },
]

/** Average minutes spent per content type. */
export const timeOnActivity = [
  { name: 'Video lessons', value: 42 },
  { name: 'Quizzes', value: 18 },
  { name: 'Readings', value: 26 },
  { name: 'Assignments', value: 34 },
  { name: 'Downloads', value: 9 },
]

export const sources = [
  { name: 'Google', value: 4200 },
  { name: 'Direct', value: 3100 },
  { name: 'Facebook', value: 1850 },
  { name: 'Instagram', value: 1240 },
  { name: 'Referral', value: 760 },
]

export const devices = [
  { name: 'Mobile', value: 62 },
  { name: 'Desktop', value: 30 },
  { name: 'Tablet', value: 8 },
]

export const browsers = [
  { name: 'Chrome', value: 58 },
  { name: 'Safari', value: 22 },
  { name: 'Firefox', value: 12 },
  { name: 'Edge', value: 8 },
]

export const topPages = [
  { path: '/courses', views: 8420, visitors: 5210, avgTime: 214, change: 12.4 },
  { path: '/course/python-for-beginners', views: 6180, visitors: 3940, avgTime: 486, change: 8.1 },
  { path: '/', views: 5240, visitors: 3410, avgTime: 128, change: -3.6 },
  { path: '/store', views: 2860, visitors: 1720, avgTime: 96, change: 5.8 },
  { path: '/communities', views: 1980, visitors: 1240, avgTime: 342, change: -1.2 },
]

export const learners = [
  { id: 1, name: 'Amina Belkacem', username: 'amina.b', email: 'amina@example.dz', role: 'User', verified: true, joined: 'Jan 12, 2025', courses: 3, progress: 82, spent: 12400, lastActive: '2 hours ago', enrollments: [
    { name: 'Python for Beginners', progress: 100 },
    { name: 'Advanced React', progress: 76 },
    { name: 'SQL Fundamentals', progress: 70 },
  ] },
  { id: 2, name: 'Yacine Mansouri', username: 'yacine.m', email: 'yacine@example.dz', role: 'Teacher', verified: true, joined: 'Feb 03, 2025', courses: 1, progress: 34, spent: 4200, lastActive: 'Yesterday', enrollments: [
    { name: 'Web Design Basics', progress: 34 },
  ] },
  { id: 3, name: 'Sara Khaldi', username: 'sara.k', email: 'sara@example.dz', role: 'User', verified: true, joined: 'Mar 21, 2025', courses: 4, progress: 100, spent: 19800, lastActive: '3 days ago', enrollments: [
    { name: 'Python for Beginners', progress: 100 },
    { name: 'Advanced React', progress: 100 },
    { name: 'Web Design Basics', progress: 100 },
    { name: 'Data Analysis 101', progress: 100 },
  ] },
  { id: 4, name: 'Mehdi Toumi', username: 'mehdi.t', email: 'mehdi@example.dz', role: 'User', verified: false, joined: 'Apr 08, 2025', courses: 2, progress: 12, spent: 7800, lastActive: '2 weeks ago', enrollments: [
    { name: 'Python for Beginners', progress: 18 },
    { name: 'SQL Fundamentals', progress: 6 },
  ] },
  { id: 5, name: 'Lina Rahmani', username: 'lina.r', email: 'lina@example.dz', role: 'User', verified: true, joined: 'May 30, 2025', courses: 1, progress: 47, spent: 4200, lastActive: '5 days ago', enrollments: [
    { name: 'Data Analysis 101', progress: 47 },
  ] },
  { id: 6, name: 'Karim Djemai', username: 'karim.d', email: 'karim@example.dz', role: 'User', verified: false, joined: 'Jun 17, 2025', courses: 1, progress: 5, spent: 4200, lastActive: '1 month ago', enrollments: [
    { name: 'Marketing Essentials', progress: 5 },
  ] },
  { id: 7, name: 'Nadia Fekir', username: 'nadia.f', email: 'nadia@example.dz', role: 'Teacher', verified: true, joined: 'Jul 04, 2025', courses: 5, progress: 73, spent: 24600, lastActive: '6 hours ago', enrollments: [
    { name: 'Python for Beginners', progress: 100 },
    { name: 'Advanced React', progress: 88 },
    { name: 'Web Design Basics', progress: 64 },
    { name: 'Data Analysis 101', progress: 52 },
    { name: 'Marketing Essentials', progress: 61 },
  ] },
  { id: 8, name: 'Riad Saidi', username: 'riad.s', email: 'riad@example.dz', role: 'User', verified: true, joined: 'Aug 19, 2025', courses: 2, progress: 58, spent: 9800, lastActive: '4 days ago', enrollments: [
    { name: 'Web Design Basics', progress: 71 },
    { name: 'SQL Fundamentals', progress: 45 },
  ] },
]

export const failedPayments = [
  { ref: 'CH-20431', user: 'Mehdi Toumi', amount: 4200, reason: 'Card declined', date: 'Oct 11' },
  { ref: 'CH-20428', user: 'Karim Djemai', amount: 4200, reason: 'Insufficient funds', date: 'Oct 11' },
  { ref: 'CH-20417', user: 'Imene Ziani', amount: 9800, reason: 'Timeout', date: 'Oct 10' },
  { ref: 'CH-20399', user: 'Amina Belkacem', amount: 4200, reason: '3-D Secure failed', date: 'Oct 09' },
]

export const teacherPayouts = [
  { name: 'Prof. Haddad', courses: 4, gross: 184000, fees: 9200, net: 174800, share: 69920 },
  { name: 'Prof. Benali', courses: 2, gross: 118000, fees: 5900, net: 112100, share: 44840 },
  { name: 'Prof. Cherif', courses: 3, gross: 96000, fees: 4800, net: 91200, share: 36480 },
]

export const topContributors = [
  { name: 'Amina Belkacem', discussions: 24, comments: 132, reactions: 410 },
  { name: 'Yacine Mansouri', discussions: 18, comments: 96, reactions: 287 },
  { name: 'Sara Khaldi', discussions: 15, comments: 84, reactions: 240 },
  { name: 'Nadia Fekir', discussions: 11, comments: 62, reactions: 178 },
  { name: 'Riad Saidi', discussions: 7, comments: 41, reactions: 96 },
]

/** Communities available in the Community tab selector ("All" is org-wide). */
export const communities = [
  { value: 'all', label: 'All communities' },
  { value: 'python-for-beginners', label: 'Python for Beginners' },
  { value: 'advanced-react', label: 'Advanced React' },
  { value: 'web-design-basics', label: 'Web Design Basics' },
  { value: 'general', label: 'General' },
]

/** Discussions grouped by label. */
export const discussionsByLabel = [
  { name: 'General', value: 184 },
  { name: 'Q&A', value: 126 },
  { name: 'Ideas', value: 74 },
  { name: 'Show & Tell', value: 52 },
  { name: 'Announcements', value: 38 },
]

/** Most popular discussion threads. */
export const topDiscussions = [
  { title: 'Why does my loop skip the last item?', label: 'Q&A', replies: 48, upvotes: 132 },
  { title: 'Show your final project', label: 'Show & Tell', replies: 71, upvotes: 118 },
  { title: 'Best resources for async/await?', label: 'Q&A', replies: 39, upvotes: 96 },
  { title: 'Course feedback: week 3 pacing', label: 'Ideas', replies: 24, upvotes: 61 },
  { title: 'Weekly update — new modules live', label: 'Announcements', replies: 12, upvotes: 44 },
]

/** Questions with no replies yet — the support gap. */
export const unansweredQuestions = [
  { title: 'Certificate not generating after completion', label: 'Q&A', author: 'Mehdi Toumi', age: '2 days', upvotes: 4 },
  { title: 'Video freezes at 04:12 on lesson 7', label: 'Q&A', author: 'Lina Rahmani', age: '3 days', upvotes: 2 },
  { title: 'Can I reset my progress?', label: 'Q&A', author: 'Karim Djemai', age: '5 days', upvotes: 1 },
]

/** Courses available in the Courses tab selector ("All" is org-wide). */
export const courses = [
  { value: 'all', label: 'All courses' },
  { value: 'python-for-beginners', label: 'Python for Beginners' },
  { value: 'advanced-react', label: 'Advanced React' },
  { value: 'web-design-basics', label: 'Web Design Basics' },
  { value: 'data-analysis-101', label: 'Data Analysis 101' },
  { value: 'sql-fundamentals', label: 'SQL Fundamentals' },
]

/** New enrollments + active learners per period for the selected course. */
export const courseEnrollmentTrend = MONTHS.map((label, i) => ({
  label,
  enrollments: [18, 22, 19, 27, 31, 28, 35, 38, 33, 44, 47, 52][i],
  active: [64, 71, 76, 84, 92, 98, 105, 113, 108, 121, 132, 140][i],
}))

/** Completion funnel — ordered stages. */
export const courseCompletionFunnel = [
  { name: 'Enrolled', value: 245 },
  { name: 'Started', value: 210 },
  { name: 'Halfway', value: 150 },
  { name: 'Completed', value: 167 },
  { name: 'Certified', value: 120 },
]

/** Learner progress distribution. */
export const courseProgressDistribution = [
  { name: '0–25%', value: 58 },
  { name: '25–50%', value: 44 },
  { name: '50–75%', value: 76 },
  { name: '75–100%', value: 67 },
]

/** Views per lesson — the drop-off curve. */
export const courseLessonDropoff = [
  { name: '1. Introduction', value: 210 },
  { name: '2. HTML Basics', value: 195 },
  { name: '3. CSS Styling', value: 180 },
  { name: '4. JavaScript', value: 140 },
  { name: '5. Project Setup', value: 96 },
]

/** Average minutes spent per lesson. */
export const courseTimePerLesson = [
  { name: '1. Introduction', value: 9 },
  { name: '2. HTML Basics', value: 12 },
  { name: '3. CSS Styling', value: 16 },
  { name: '4. JavaScript', value: 20 },
  { name: '5. Project Setup', value: 24 },
]

/** Enrolled learners for the selected course. */
export const courseStudents = [
  { name: 'Ahmed Benali', email: 'ahmed@example.dz', enrolled: 'Sep 20, 2025', progress: 75, status: 'Active' },
  { name: 'Fatima Zohra', email: 'fatima@example.dz', enrolled: 'Sep 18, 2025', progress: 100, status: 'Completed' },
  { name: 'Mohamed Khelif', email: 'mohamed@example.dz', enrolled: 'Sep 15, 2025', progress: 20, status: 'Active' },
  { name: 'Amina Said', email: 'amina@example.dz', enrolled: 'Sep 10, 2025', progress: 0, status: 'Inactive' },
  { name: 'Yacine Mansouri', email: 'yacine@example.dz', enrolled: 'Sep 02, 2025', progress: 48, status: 'Active' },
]

/** Podcasts available in the Podcasts tab selector ("All" is org-wide). */
export const podcasts = [
  { value: 'all', label: 'All podcasts' },
  { value: 'tech-talks', label: 'Tech Talks' },
  { value: 'algerian-history', label: 'Algerian History' },
  { value: 'study-tips', label: 'Study Tips' },
]

/** Episode starts + completions per period. */
export const podcastListeningTrend = MONTHS.map((label, i) => ({
  label,
  starts: [120, 138, 131, 154, 168, 162, 185, 201, 194, 218, 236, 249][i],
  completions: [72, 84, 79, 96, 104, 99, 118, 129, 121, 140, 154, 166][i],
}))

/** Plays per episode (ranked). */
export const podcastEpisodePlays = [
  { name: 'Ep 1 · Getting Started', value: 1240 },
  { name: 'Ep 2 · Core Concepts', value: 1080 },
  { name: 'Ep 3 · Deep Dive', value: 860 },
  { name: 'Ep 4 · Case Study', value: 640 },
  { name: 'Ep 5 · Wrap Up', value: 410 },
]

/** Completion rate (%) per episode. */
export const podcastEpisodeCompletion = [
  { name: 'Ep 1 · Getting Started', value: 74 },
  { name: 'Ep 2 · Core Concepts', value: 68 },
  { name: 'Ep 3 · Deep Dive', value: 57 },
  { name: 'Ep 4 · Case Study', value: 49 },
  { name: 'Ep 5 · Wrap Up', value: 61 },
]

/** Episode length vs average minutes actually listened. */
export const podcastLengthVsListened = [
  { name: 'Ep 1', length: 32, listened: 27 },
  { name: 'Ep 2', length: 41, listened: 31 },
  { name: 'Ep 3', length: 28, listened: 19 },
  { name: 'Ep 4', length: 36, listened: 21 },
  { name: 'Ep 5', length: 24, listened: 16 },
]

/** How far through the series listeners get. */
export const podcastSeriesProgress = [
  { name: '0–25%', value: 96 },
  { name: '25–50%', value: 62 },
  { name: '50–75%', value: 48 },
  { name: '75–100%', value: 71 },
]

/** Episodes for the selected podcast. */
export const podcastEpisodes = [
  { title: 'Getting Started', status: 'Published', duration: '32m 10s', plays: 1240, completion: 74 },
  { title: 'Core Concepts', status: 'Published', duration: '41m 05s', plays: 1080, completion: 68 },
  { title: 'Deep Dive', status: 'Published', duration: '28m 40s', plays: 860, completion: 57 },
  { title: 'Case Study', status: 'Draft', duration: '36m 22s', plays: 640, completion: 49 },
  { title: 'Wrap Up', status: 'Published', duration: '24m 15s', plays: 410, completion: 61 },
]
