"""Text the seeder puts in front of humans.

Rules held everywhere in this file:
  no hyphens or underscores as punctuation, no ellipses, no em dashes
  no marketing filler, no perfectly parallel sentence lists
  community text reads like people typing, not like a brochure
"""

FIRST_NAMES = [
    "Yacine", "Amine", "Lina", "Sarah", "Ilyes", "Nour", "Meriem", "Anis",
    "Wassim", "Rania", "Sofiane", "Nesrine", "Bilal", "Hakim", "Imene", "Zakaria",
    "Yasmine", "Karim", "Sabrina", "Mehdi", "Farid", "Sonia", "Adel", "Dounia",
    "Islam", "Nadia", "Tarek", "Houda", "Reda", "Asma", "Riad", "Sara",
    "Oussama", "Lamia", "Nabil", "Imane", "Fouad", "Chaima", "Younes", "Amel",
    "Rachid", "Khadija", "Salim", "Nourhane", "Walid", "Malak", "Hamza", "Aya",
    "Brahim", "Fella", "Djamel", "Rym", "Adam", "Salsabil", "Ayoub", "Tasnim",
    "Ibrahim", "Manel", "Kamel", "Wissam", "Nadir", "Hiba", "Yanis", "Nawel",
    "Redouane", "Ihsane", "Samir", "Amina", "Lotfi", "Rahma", "Toufik", "Lin",
    "Marouane", "Clara", "Ahmed", "Emma", "Omar", "Lea", "Ali", "Chloe",
    "Youssef", "Ines", "Hugo", "Jade", "Theo", "Maya", "Rayane", "Louise",
    "Mustapha", "Camille", "Sid", "Ana", "Bilal", "Nina", "Anes", "Eva",
    "Achraf", "Mila", "Zinedine", "Salma", "Ilyas", "Mira", "Idris", "Yara",
]

LAST_NAMES = [
    "Benali", "Bouzid", "Haddad", "Mansouri", "Khelifi", "Saidi", "Belkacem",
    "Cherif", "Ait Ali", "Bensalem", "Lounis", "Meziane", "Rahmani", "Zerrouki",
    "Ferhat", "Guerrouj", "Benyoucef", "Taleb", "Boudjema", "Hamdi", "Aissou",
    "Kaci", "Amrouche", "Belaid", "Slimani", "Merabet", "Djebbar", "Ouali",
    "Martin", "Bernard", "Moreau", "Dubois", "Rossi", "Costa", "Hansen",
    "Novak", "Farah", "Nasser", "Halim", "Yildiz", "Karim", "Aziz",
]

BIOS = [
    "Product designer in Algiers. Most of my work is dashboards that people have to use every day.",
    "I teach design on the side and I still draw wireframes on paper first.",
    "Front end developer. I care about spacing more than I should.",
    "Learning Figma properly this year. Currently rebuilding my portfolio from scratch.",
    "Community manager by day, film photography on weekends.",
    "Working on my first paid client project. Ask me how it is going in a month.",
    "Data analyst. I like clean tables and honest charts.",
    "Motion designer. After Effects is open on my other monitor right now.",
    "Backend developer. Python and Postgres most days.",
    "Student in computer science. Here to learn things school does not teach.",
    "Freelance copywriter. Short sentences pay my rent.",
    "I run a small studio with two friends. We do brand and product work.",
    "Accessibility advocate. If your form needs a mouse, I have notes.",
    "Photographer. I shoot products for small shops around the city.",
    "Marketing lead. I lurk here to steal good ideas.",
    "Just finished the design course. Now I am broke but my screens look better.",
]

YOUNG_BIOS = [
    "",
    "",
    "Still figuring things out.",
    "Here to learn.",
    "Watching and reading mostly.",
    "",
    "Trying to get my first client.",
    "",
]

MODULES = [
    ("Week 1: A project that starts clean", [
        "Python, dependencies and a folder layout you can live with",
        "Git commits that tell the truth",
        "Writing your first endpoint",
        "Running it locally without pain",
    ]),
    ("Week 2: Requests and responses", [
        "Paths, query strings and request bodies",
        "Pydantic models that do not lie",
        "Error responses people can act on",
        "One router per resource",
    ]),
    ("Week 3: Database and migrations", [
        "Tables, keys and the shape of a user",
        "Queries without guessing",
        "Migrations you can run twice",
        "Seed data for testing",
    ]),
    ("Week 4: Auth and permissions", [
        "Passwords, hashing and what never goes in a log",
        "Tokens and refresh without confusion",
        "Roles and the checks people forget",
        "Protecting an endpoint end to end",
    ]),
    ("Week 5: Tests and debugging", [
        "Your first test that catches a real bug",
        "Fixtures and a separate test database",
        "Reading a stack trace calmly",
        "Logging that helps at 2 am",
    ]),
    ("Week 6: Deploy and operate", [
        "Docker without copying a tutorial",
        "Environment variables and secrets",
        "Deploying behind a reverse proxy",
        "Backups, monitoring and what to do when it breaks",
    ]),
]

# Per lesson sections for the flagship curriculum. The lesson page renders
# "What you'll learn", "Key takeaways", "Resources" and "Knowledge check" only
# when the activity carries them, so a lesson without an entry here shows the
# player and nothing else.
LESSON_SECTIONS = {
    "How this course works": {
        "objectives": [
            "See the six week shape before you commit to it",
            "Know what each week asks of you and how much time it takes",
            "Understand how the Friday review works and what I look for",
        ],
        "takeaways": [
            {
                "title": "One project, six weeks",
                "items": [
                    "You build the same API from week one to week six.",
                    "Each week adds one layer: requests, database, auth, tests, deploy.",
                    "Nothing is thrown away when a new week starts.",
                ],
            },
            {
                "title": "Lessons are short by design",
                "items": [
                    "A lesson explains one idea, not five.",
                    "The exercise is where the idea becomes yours.",
                    "Watching without typing does not count as progress.",
                ],
            },
            {
                "title": "A rhythm you can keep",
                "items": [
                    "One lesson and one exercise per week.",
                    "Reviews happen on Friday, on your pull request.",
                    "Missing a week is recoverable. Missing three usually is not.",
                ],
            },
        ],
        "resources": [
            {"name": "FastAPI documentation", "url": "https://fastapi.tiangolo.com/"},
            {"name": "Python 3 documentation", "url": "https://docs.python.org/3/"},
            {"name": "MDN, HTTP overview", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"},
        ],
        "checks": [
            {
                "question": "What does each week add to the same project?",
                "answer": "One layer: requests, then the database, then auth, then tests, then deployment.",
            },
            {
                "question": "Where does feedback on an exercise happen?",
                "answer": "On the pull request, during the Friday review.",
            },
            {
                "question": "What counts as progress in this course?",
                "answer": "Writing the exercise, not watching the lesson.",
            },
            {
                "question": "How long does the project run?",
                "answer": "Six weeks, each week building on the previous one.",
            },
            {
                "question": "Why are the lessons short?",
                "answer": "So the exercise, where the learning actually happens, gets the time.",
            },
            {
                "question": "What happens if you miss a week?",
                "answer": "You can catch up; three missed weeks in a row is where most people stop.",
            },
        ],
    },
    "What you need before we start": {
        "objectives": [
            "Install Python 3.11 or newer and confirm the version in a terminal",
            "Configure git with your name and email so commits are attributed",
            "Create the empty project folder we use for the whole course",
        ],
        "takeaways": [
            {
                "title": "Three tools, nothing more",
                "items": [
                    "Python 3.11 or newer.",
                    "git, configured with your name and email.",
                    "An editor that can open a terminal.",
                ],
            },
            {
                "title": "Check versions first",
                "items": [
                    "Run python --version before the first lesson.",
                    "Older interpreters break the type hints we write.",
                    "Docker is not needed until week six.",
                ],
            },
            {
                "title": "Set up once, properly",
                "items": [
                    "Create one empty folder for the whole course.",
                    "Initialise git inside it on day one.",
                    "Commit the empty state so every later change has a baseline.",
                ],
            },
        ],
        "resources": [
            {"name": "Python downloads", "url": "https://www.python.org/downloads/"},
            {"name": "Installing git", "url": "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git"},
            {"name": "Pro Git, first time setup", "url": "https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup"},
        ],
        "checks": [
            {
                "question": "Which Python version does the course require?",
                "answer": "3.11 or newer.",
            },
            {
                "question": "Why configure your git name and email before starting?",
                "answer": "Every commit is attributed to that identity; without it the history is anonymous.",
            },
            {
                "question": "When is Docker needed?",
                "answer": "Week six, for deployment.",
            },
            {
                "question": "What do you create on day one?",
                "answer": "An empty project folder with a git repository inside it.",
            },
            {
                "question": "What breaks on an older Python version?",
                "answer": "The type hints used throughout the course.",
            },
            {
                "question": "How many tools do you install before week one?",
                "answer": "Three: Python, git and an editor.",
            },
        ],
    },
    "Python, dependencies and a folder layout you can live with": {
        "objectives": [
            "Create and activate a virtual environment without copying a command you do not understand",
            "Lay out folders so code, tests and configuration never mix",
            "Pin dependencies so a fresh clone installs the same versions",
        ],
        "takeaways": [
            {
                "title": "The virtual environment is the project",
                "items": [
                    "One environment per project, never a global install.",
                    "Activate it before running anything.",
                    "Recreate it from requirements on a new machine.",
                ],
            },
            {
                "title": "A layout that survives month two",
                "items": [
                    "app/ for code and tests/ for tests.",
                    "Configuration at the root, not buried three folders deep.",
                    "Nothing loose at the top level.",
                ],
            },
            {
                "title": "Pin what you depend on",
                "items": [
                    "Exact versions, not ranges.",
                    "A range lets a new release break your build silently.",
                    "Upgrading becomes a decision you make, not a surprise.",
                ],
            },
        ],
        "resources": [
            {"name": "venv, the standard library way", "url": "https://docs.python.org/3/library/venv.html"},
            {"name": "Requirements file format", "url": "https://pip.pypa.io/en/stable/reference/requirements-file-format/"},
            {"name": "Python packaging guide", "url": "https://packaging.python.org/en/latest/"},
        ],
        "checks": [
            {
                "question": "Why does each project get its own virtual environment?",
                "answer": "So dependencies do not collide between projects, and a fresh machine can rebuild the exact set.",
            },
            {
                "question": "What does pinning a dependency mean?",
                "answer": "Writing an exact version instead of a range.",
            },
            {
                "question": "Why is a version range risky?",
                "answer": "A new release can break the build without any change on your side.",
            },
            {
                "question": "Where do tests live in the layout?",
                "answer": "In tests/, next to app/ but never inside it.",
            },
            {
                "question": "How do you rebuild an environment on a new machine?",
                "answer": "Create a venv and install from the pinned requirements file.",
            },
            {
                "question": "What goes at the top level of the project?",
                "answer": "Code, tests and configuration only.",
            },
        ],
    },
    "Git commits that tell the truth": {
        "objectives": [
            "Write messages that explain why a change exists, not what the diff already shows",
            "Keep each commit small enough to review in one sitting",
            "Undo a mistake without rewriting history other people already pulled",
        ],
        "takeaways": [
            {
                "title": "Commits people can read",
                "items": [
                    "One change per commit, one reason per message.",
                    "The subject line says why, the body says how if needed.",
                    "If the message needs the word also, split the commit.",
                ],
            },
            {
                "title": "Small enough to review",
                "items": [
                    "A commit should make sense on its own.",
                    "Mixed refactors and features hide bugs.",
                    "Commit before a refactor, not after.",
                ],
            },
            {
                "title": "Undo without damage",
                "items": [
                    "git revert adds a fix and keeps history intact.",
                    "git reset --hard rewrites what others already pulled.",
                    "Never rewrite a branch someone else is working on.",
                ],
            },
        ],
        "resources": [
            {"name": "Pro Git, recording changes", "url": "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository"},
            {"name": "Pro Git, undoing things", "url": "https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things"},
            {"name": "Conventional commits", "url": "https://www.conventionalcommits.org/en/v1.0.0/"},
        ],
        "checks": [
            {
                "question": "What should a commit subject line explain?",
                "answer": "Why the change exists, not what the diff already shows.",
            },
            {
                "question": "When should a commit be split?",
                "answer": "When describing it needs the word also.",
            },
            {
                "question": "Which command safely undoes a pushed commit?",
                "answer": "git revert, because it adds a new commit instead of rewriting history.",
            },
            {
                "question": "Why is git reset --hard dangerous on a shared branch?",
                "answer": "It removes commits other people have already pulled.",
            },
            {
                "question": "What should you do before a large refactor?",
                "answer": "Commit the working state first, so the refactor can be reverted alone.",
            },
            {
                "question": "What makes a commit easy to review?",
                "answer": "One change and one reason, with nothing unrelated mixed in.",
            },
        ],
    },
    "Writing your first endpoint": {
        "objectives": [
            "Define a route and return JSON without a manual open in another window",
            "Read the documentation page FastAPI generates for you",
            "Change a response and see it live without restarting by hand",
        ],
        "takeaways": [
            {"title": "A route is three things", "items": ["A path, a method and a function.", "The method decides what the route means.", "The function returns data, not HTML."]},
            {"title": "Return data, shape it later", "items": ["A dictionary is enough for the first version.", "Give keys names a client would guess.", "Add a response model once the shape settles."]},
            {"title": "The docs page is your client", "items": ["Open /docs after every change.", "Try the route there before writing a front end.", "If it fails there, the bug is in the API."]},
        ],
        "resources": [
            {"name": "FastAPI first steps", "url": "https://fastapi.tiangolo.com/tutorial/first-steps/"},
            {"name": "Uvicorn documentation", "url": "https://www.uvicorn.org/"},
            {"name": "MDN, HTTP request methods", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods"},
        ],
        "checks": [
            {"question": "What three parts define a route?", "answer": "A path, an HTTP method and a function."},
            {"question": "Which method should read data without changing it?", "answer": "GET."},
            {"question": "Which method creates a new record?", "answer": "POST."},
            {"question": "Where can you call a route without writing a client?", "answer": "The /docs page FastAPI generates."},
            {"question": "What should the first version of a response be?", "answer": "A dictionary with sensibly named keys."},
            {"question": "What does the function behind a route return?", "answer": "Data that FastAPI serialises to JSON."},
        ],
    },
    "Build a booking endpoint": {
        "objectives": [
            "Turn a phone based booking process into a single create route",
            "Reject requests missing a date or a name with a clear error",
            "Test the route from the docs page before handing it over",
        ],
        "takeaways": [
            {"title": "Start from the paper process", "items": ["Write down what the receptionist asks for.", "Everything they need belongs in the body.", "Anything they never ask for does not."]},
            {"title": "Validation is the feature", "items": ["A missing date is a normal case, not an exception.", "Name the field that failed.", "Return 422, never 500, for bad input."]},
            {"title": "Prove it before sending", "items": ["Call it once with valid data.", "Call it once with the date removed.", "Check both responses in the docs page."]},
        ],
        "resources": [
            {"name": "FastAPI request body", "url": "https://fastapi.tiangolo.com/tutorial/body/"},
            {"name": "Pydantic field types", "url": "https://docs.pydantic.dev/latest/concepts/fields/"},
            {"name": "MDN, HTTP status 422", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422"},
        ],
        "checks": [
            {"question": "What belongs in the request body of a create route?", "answer": "Every field the booking needs, and nothing else."},
            {"question": "Which status code for a missing required field?", "answer": "422 Unprocessable Content."},
            {"question": "Why not return 500 for bad input?", "answer": "A 500 says the server broke; bad input is the client's mistake and must be named."},
            {"question": "What should the error message include?", "answer": "The name of the field that failed."},
            {"question": "How do you verify the endpoint before submitting?", "answer": "Call it with valid and invalid data from the docs page."},
            {"question": "What is the first step of the exercise?", "answer": "Write down what the receptionist asks for on the phone."},
        ],
    },
    "Paths, query strings and request bodies": {
        "objectives": [
            "Choose between a path parameter and a query string without guessing",
            "Read a request body as a typed object instead of a raw dictionary",
            "Keep route names predictable for people who never read your code",
        ],
        "takeaways": [
            {"title": "Where each value belongs", "items": ["Identity in the path, filters in the query, content in the body.", "A path parameter must be required.", "A query string is optional by nature."]},
            {"title": "Never put a secret in a URL", "items": ["Query strings end up in logs and history.", "Tokens belong in headers.", "Passwords belong nowhere in a URL."]},
            {"title": "Predictable names", "items": ["Plural nouns for collections.", "The id after the noun, not before it.", "If a client has to guess, the route is wrong."]},
        ],
        "resources": [
            {"name": "FastAPI path parameters", "url": "https://fastapi.tiangolo.com/tutorial/path-params/"},
            {"name": "FastAPI query parameters", "url": "https://fastapi.tiangolo.com/tutorial/query-params/"},
            {"name": "MDN, URL anatomy", "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL"},
        ],
        "checks": [
            {"question": "Where does an identifier belong?", "answer": "In the path."},
            {"question": "Where does a filter belong?", "answer": "In the query string."},
            {"question": "Where does the content of a create request belong?", "answer": "In the request body."},
            {"question": "Why must a path parameter be required?", "answer": "Without it the path does not identify a resource."},
            {"question": "Why is a token in a query string a bad idea?", "answer": "URLs are logged, cached and kept in browser history."},
            {"question": "Which naming style do collections use?", "answer": "Plural nouns, with the id after the noun."},
        ],
    },
    "Pydantic models that do not lie": {
        "objectives": [
            "Describe a request body with a model instead of trusting the client",
            "Add constraints that reject bad data before it reaches the database",
            "Keep separate models for creating a record and returning one",
        ],
        "takeaways": [
            {"title": "Input and output are different models", "items": ["Input carries what the client sends.", "Output carries what you are willing to publish.", "Reusing the database model leaks internal fields."]},
            {"title": "Optional versus default", "items": ["Optional means the field may be absent.", "A default means absent is acceptable.", "Required with no default is a promise the client must keep."]},
            {"title": "Constrain at the edge", "items": ["Set minimum and maximum lengths.", "Validate emails and dates in the model.", "Bad data should stop before the database."]},
        ],
        "resources": [
            {"name": "Pydantic models", "url": "https://docs.pydantic.dev/latest/concepts/models/"},
            {"name": "Pydantic validators", "url": "https://docs.pydantic.dev/latest/concepts/validators/"},
            {"name": "FastAPI response model", "url": "https://fastapi.tiangolo.com/tutorial/response-model/"},
        ],
        "checks": [
            {"question": "Why not reuse the database model as the API response?", "answer": "It leaks fields you never meant to publish, like password hashes."},
            {"question": "What does Optional mean in a model?", "answer": "The field may be absent from the payload."},
            {"question": "What does a default value mean?", "answer": "The client may omit the field and the server supplies the value."},
            {"question": "Where should a length constraint live?", "answer": "In the model, so it is checked before the handler runs."},
            {"question": "Which status code does a failed model validation produce?", "answer": "422 Unprocessable Content."},
            {"question": "Why separate create and read models?", "answer": "Input and output rarely contain the same fields."},
        ],
    },
    "Error responses people can act on": {
        "objectives": [
            "Return status codes that match what actually happened",
            "Write error bodies a front end can render without a translator",
            "Stop leaking stack traces to the person using the app",
        ],
        "takeaways": [
            {"title": "Codes carry meaning", "items": ["400 means the request itself is malformed.", "401 means we do not know who you are.", "403 means we know you and you still cannot."]},
            {"title": "One error shape, everywhere", "items": ["Pick a body shape and keep it for life.", "A front end should parse it once.", "Changing the shape later breaks every client."]},
            {"title": "Logs are not responses", "items": ["A stack trace belongs in the log.", "The response names what the user can fix.", "Internal ids and paths are not user information."]},
        ],
        "resources": [
            {"name": "Handling errors in FastAPI", "url": "https://fastapi.tiangolo.com/tutorial/handling-errors/"},
            {"name": "MDN, HTTP status codes", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"},
            {"name": "RFC 9457, problem details", "url": "https://www.rfc-editor.org/rfc/rfc9457"},
        ],
        "checks": [
            {"question": "What does 400 mean?", "answer": "The request is malformed or invalid."},
            {"question": "What does 401 mean?", "answer": "The caller is not authenticated."},
            {"question": "What does 403 mean?", "answer": "The caller is authenticated but not allowed."},
            {"question": "Where does a stack trace belong?", "answer": "In the server log, never in the response."},
            {"question": "Why keep one error shape across an API?", "answer": "So clients parse errors in one place instead of guessing per endpoint."},
            {"question": "What should an error message tell the user?", "answer": "What went wrong and what they can do about it."},
        ],
    },
    "One router per resource": {
        "objectives": [
            "Split routes into files before the single main file becomes unreadable",
            "Mount routers with a prefix so paths stay consistent",
            "Find the code behind an endpoint in under ten seconds",
        ],
        "takeaways": [
            {"title": "One file per resource", "items": ["Bookings in bookings.py, users in users.py.", "The file name is the resource name.", "Main only registers routers."]},
            {"title": "Prefixes belong to the router", "items": ["Set the prefix once when including it.", "Routes inside stay short.", "Changing a prefix is one line, not forty."]},
            {"title": "Tags make the docs usable", "items": ["Group endpoints with a tag.", "The docs page mirrors your file structure.", "A reviewer can find an endpoint by reading tags."]},
        ],
        "resources": [
            {"name": "FastAPI bigger applications", "url": "https://fastapi.tiangolo.com/tutorial/bigger-applications/"},
            {"name": "APIRouter reference", "url": "https://fastapi.tiangolo.com/reference/apirouter/"},
            {"name": "Python modules", "url": "https://docs.python.org/3/tutorial/modules.html"},
        ],
        "checks": [
            {"question": "How many resources should one router file handle?", "answer": "One, named after the resource."},
            {"question": "Where should the /bookings prefix be declared?", "answer": "On the router when it is included, not on every route."},
            {"question": "What does the main application file do after the split?", "answer": "Creates the app and registers routers."},
            {"question": "What do tags change?", "answer": "How endpoints are grouped on the docs page."},
            {"question": "Why keep routes short inside a router?", "answer": "The prefix already carries the resource path."},
            {"question": "What is a sign the split is overdue?", "answer": "You have to scroll to find an endpoint."},
        ],
    },
    "Tables, keys and the shape of a user": {
        "objectives": [
            "Design a small schema with a primary key and one foreign key",
            "Decide what belongs in the user table and what does not",
            "Explain why a nullable column is a decision, not a default",
        ],
        "takeaways": [
            {"title": "Keys first", "items": ["Every table needs a primary key.", "A foreign key points at another table's key.", "Store relationships, not repeated text."]},
            {"title": "Nullability is a promise", "items": ["Every nullable column needs an empty case handled.", "Default to not null and add nulls on purpose.", "A nullable key is usually a modelling mistake."]},
            {"title": "Types that survive", "items": ["Timestamps as timestamps, not formatted strings.", "Money as integers or decimals, never floats.", "Emails and names as text with a length limit."]},
        ],
        "resources": [
            {"name": "PostgreSQL data types", "url": "https://www.postgresql.org/docs/current/datatype.html"},
            {"name": "PostgreSQL constraints", "url": "https://www.postgresql.org/docs/current/ddl-constraints.html"},
            {"name": "SQLModel tables", "url": "https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/"},
        ],
        "checks": [
            {"question": "What is a primary key?", "answer": "The column that uniquely identifies a row."},
            {"question": "What does a foreign key do?", "answer": "It points at the primary key of another table."},
            {"question": "Why is a nullable column a decision?", "answer": "It forces every reader to handle the empty case."},
            {"question": "Why avoid storing dates as text?", "answer": "Sorting, comparison and time zones break silently."},
            {"question": "Why not store money as a float?", "answer": "Rounding errors accumulate and totals stop matching."},
            {"question": "What is the safest default for a new column?", "answer": "Not null, until there is a real reason for empty values."},
        ],
    },
    "Queries without guessing": {
        "objectives": [
            "Write a select that filters and sorts on the database side",
            "Read a query result without assuming the order is stable",
            "Spot an N+1 query before it reaches production",
        ],
        "takeaways": [
            {"title": "Filter in SQL, not in Python", "items": ["A select with where returns only what you need.", "Filtering after the fetch wastes memory and time.", "Sorting belongs in order by."]},
            {"title": "Order is not free", "items": ["Rows come back in no guaranteed order.", "Without order by, pagination repeats and skips rows.", "Always sort when the user sees a list."]},
            {"title": "Spot the N+1", "items": ["One query for the list, one more per row.", "It looks fine on ten rows.", "Load the relation in the same query or in one batch."]},
        ],
        "resources": [
            {"name": "SQLModel select", "url": "https://sqlmodel.tiangolo.com/tutorial/select/"},
            {"name": "PostgreSQL select", "url": "https://www.postgresql.org/docs/current/sql-select.html"},
            {"name": "Use the index, Luke", "url": "https://use-the-index-luke.com/"},
        ],
        "checks": [
            {"question": "Where should filtering happen?", "answer": "In SQL, with a where clause, not after the fetch."},
            {"question": "What is an N+1 query?", "answer": "One query for a list plus one extra query per row."},
            {"question": "Why does pagination need an order by?", "answer": "Without a stable order rows can repeat or disappear between pages."},
            {"question": "What does order by do?", "answer": "It sorts the result set in the database."},
            {"question": "When does an N+1 become visible?", "answer": "As the table grows, usually in production."},
            {"question": "How do you load a relation efficiently?", "answer": "Join or prefetch it in one query instead of per row."},
        ],
    },
    "Migrations you can run twice": {
        "objectives": [
            "Write a migration that is safe on an empty and on a full database",
            "Roll a migration back without losing the data you meant to keep",
            "Review a migration before it touches production",
        ],
        "takeaways": [
            {"title": "Every migration has two directions", "items": ["Up creates, down removes.", "If you cannot write down, say why in the file.", "A missing rollback is a decision, not an oversight."]},
            {"title": "Test it twice", "items": ["Run it on an empty database.", "Run it again on one that already has the change.", "Twice is the only proof that matters."]},
            {"title": "Rename is a two step deploy", "items": ["Add the new column and write to both.", "Backfill, switch reads, then drop.", "Old code keeps writing to the old name until it ships."]},
        ],
        "resources": [
            {"name": "Alembic tutorial", "url": "https://alembic.sqlalchemy.org/en/latest/tutorial.html"},
            {"name": "Alembic operations", "url": "https://alembic.sqlalchemy.org/en/latest/ops.html"},
            {"name": "PostgreSQL alter table", "url": "https://www.postgresql.org/docs/current/sql-altertable.html"},
        ],
        "checks": [
            {"question": "What two directions does a migration have?", "answer": "Up to apply the change, down to roll it back."},
            {"question": "How do you prove a migration is safe?", "answer": "Run it, roll it back, then run it again on existing data."},
            {"question": "Why is renaming a column risky?", "answer": "Running code still writes to the old name until it is deployed."},
            {"question": "What is the safe way to rename a column?", "answer": "Add, backfill, switch reads, then drop the old one."},
            {"question": "When should the rollback be written?", "answer": "In the same change as the migration, not later."},
            {"question": "What happens when a migration fails halfway?", "answer": "The database is left in a partial state, which is why it must be reversible."},
        ],
    },
    "Add a database migration": {
        "objectives": [
            "Create a bookings table with the fields the endpoint needs",
            "Write the migration and prove it is safe to run twice",
            "Add seed rows so the endpoint returns something on a fresh database",
        ],
        "takeaways": [
            {"title": "Design the table on paper", "items": ["List the columns the endpoint reads.", "Pick types before writing the migration.", "Decide nullability column by column."]},
            {"title": "Seed data proves the query", "items": ["An empty table hides broken joins.", "Insert three rows that look real.", "Check the endpoint returns them."]},
            {"title": "The bar for done", "items": ["It runs once on an empty database.", "It runs again without an error.", "The rollback leaves nothing behind."]},
        ],
        "resources": [
            {"name": "Alembic operations", "url": "https://alembic.sqlalchemy.org/en/latest/ops.html"},
            {"name": "SQLModel create table", "url": "https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/"},
            {"name": "PostgreSQL insert", "url": "https://www.postgresql.org/docs/current/sql-insert.html"},
        ],
        "checks": [
            {"question": "What should you do before writing the migration?", "answer": "List the columns the endpoint needs and their types."},
            {"question": "Why add seed rows to the table?", "answer": "So joins and endpoints can be tested before real data exists."},
            {"question": "How many times should the migration be run locally?", "answer": "At least twice, the second time on existing data."},
            {"question": "What should the rollback do?", "answer": "Remove exactly what the migration created, and nothing else."},
            {"question": "Which fields does the bookings table need?", "answer": "Whatever the create route accepts, plus an id and a timestamp."},
            {"question": "What does an empty table hide?", "answer": "Broken joins and queries that return nothing for the wrong reason."},
        ],
    },
    "Passwords, hashing and what never goes in a log": {
        "objectives": [
            "Hash a password with a current algorithm instead of a home made one",
            "Keep secrets out of logs, error messages and API responses",
            "Explain why you cannot email a password back to a user",
        ],
        "takeaways": [
            {"title": "Hash, never encrypt", "items": ["A hash cannot be reversed, and that is the point.", "Encryption implies you can read it back.", "You only ever compare, never recover."]},
            {"title": "One way, with salt", "items": ["Every password gets its own salt.", "Use bcrypt, argon2 or scrypt.", "Never write your own hashing function."]},
            {"title": "Secrets stay out of logs", "items": ["Log the user id, not the credential.", "Request bodies are not log material.", "A secret in a stack trace is a leak."]},
        ],
        "resources": [
            {"name": "OWASP password storage", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"},
            {"name": "Python hashlib", "url": "https://docs.python.org/3/library/hashlib.html"},
            {"name": "OWASP logging cheat sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html"},
        ],
        "checks": [
            {"question": "Why hash a password instead of encrypting it?", "answer": "A hash cannot be reversed, so a stolen database does not hand over passwords."},
            {"question": "Why does each password need a salt?", "answer": "So identical passwords produce different hashes."},
            {"question": "Which algorithms are acceptable?", "answer": "bcrypt, argon2 or scrypt with sensible parameters."},
            {"question": "What belongs in an authentication log line?", "answer": "The user id, the result, and a timestamp, never the credential."},
            {"question": "Can support recover a user's password?", "answer": "No. It is not stored; the only path is a reset."},
            {"question": "What should you do if a secret appears in a stack trace?", "answer": "Treat it as leaked and rotate it."},
        ],
    },
    "Tokens and refresh without confusion": {
        "objectives": [
            "Issue a short lived access token and a longer lived refresh token",
            "Store and send tokens without exposing them to scripts",
            "Handle expiry without logging the user out mid task",
        ],
        "takeaways": [
            {"title": "Two tokens, two jobs", "items": ["Access tokens are short lived and sent with every request.", "Refresh tokens live longer and are used rarely.", "Only the refresh token can mint a new access token."]},
            {"title": "Claims are not secrets", "items": ["Anyone can read a JWT payload.", "Put the user id and expiry in it, nothing sensitive.", "The signature proves it was not edited."]},
            {"title": "Expiry is normal", "items": ["A 401 is not always an attack.", "Refresh once, then retry the request.", "Keep that logic in one place."]},
        ],
        "resources": [
            {"name": "Introduction to JWTs", "url": "https://jwt.io/introduction"},
            {"name": "OWASP session management", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"},
            {"name": "FastAPI OAuth2 with JWT", "url": "https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/"},
        ],
        "checks": [
            {"question": "What is the difference between access and refresh tokens?", "answer": "Access tokens are short lived and used constantly; refresh tokens are long lived and used to get new access tokens."},
            {"question": "Can a client read the contents of a JWT?", "answer": "Yes. The payload is encoded, not encrypted."},
            {"question": "What does the signature prove?", "answer": "That the token was issued by you and not modified."},
            {"question": "Which status code means the access token expired?", "answer": "401 Unauthorized."},
            {"question": "Why keep access tokens short lived?", "answer": "A stolen token stops working quickly."},
            {"question": "Where should the refresh flow live?", "answer": "In one place in the client, not repeated per request."},
        ],
    },
    "Roles and the checks people forget": {
        "objectives": [
            "Add a role check that runs before the handler does",
            "Find the endpoints where ownership matters more than role",
            "Test the negative case, not only the happy path",
        ],
        "takeaways": [
            {"title": "Two questions, not one", "items": ["Does this role allow it?", "Does this user own the row?", "Both must pass before the handler runs."]},
            {"title": "Every route needs its own check", "items": ["Protecting the list route does not protect the detail route.", "Route level checks are easy to forget.", "A dependency makes the check hard to skip."]},
            {"title": "Test the refusal", "items": ["Call the endpoint without a token.", "Call it with the wrong role.", "Call it as another user for their row."]},
        ],
        "resources": [
            {"name": "OWASP authorization", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"},
            {"name": "FastAPI dependencies", "url": "https://fastapi.tiangolo.com/tutorial/dependencies/"},
            {"name": "OWASP broken access control", "url": "https://owasp.org/Top10/A01_2021-Broken_Access_Control/"},
        ],
        "checks": [
            {"question": "What two questions must an authorization check answer?", "answer": "Does the role allow it, and does the user own this row?"},
            {"question": "Why is protecting a list route not enough?", "answer": "The detail route is a separate endpoint that can leak the same data."},
            {"question": "What is the most common access control bug?", "answer": "An endpoint that simply has no check."},
            {"question": "What should a test check besides the happy path?", "answer": "The refusal: no token, wrong role, another user's row."},
            {"question": "Where does an auth check belong?", "answer": "In a dependency, so the handler cannot run without it."},
            {"question": "Which status code for a role that is not allowed?", "answer": "403 Forbidden."},
        ],
    },
    "Protecting an endpoint end to end": {
        "objectives": [
            "Wire a dependency that rejects missing or expired tokens",
            "Return 401 and 403 for the right reasons",
            "Prove it with two requests, one with a token and one without",
        ],
        "takeaways": [
            {"title": "A dependency, not an if statement", "items": ["Attach the check to the route.", "The handler never runs without it.", "Copying the check into each route invites a miss."]},
            {"title": "Know which refusal you send", "items": ["No token or a bad one is 401.", "A valid token without permission is 403.", "A missing row is 404, not 403."]},
            {"title": "Prove all three cases", "items": ["Request with no token.", "Request with an expired token.", "Request with a valid token."]},
        ],
        "resources": [
            {"name": "FastAPI security", "url": "https://fastapi.tiangolo.com/tutorial/security/"},
            {"name": "FastAPI dependencies", "url": "https://fastapi.tiangolo.com/tutorial/dependencies/"},
            {"name": "OWASP authentication", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"},
        ],
        "checks": [
            {"question": "Where should the token check live?", "answer": "In a dependency attached to the route."},
            {"question": "Which code for a request with no token?", "answer": "401 Unauthorized."},
            {"question": "Which code for a valid token without permission?", "answer": "403 Forbidden."},
            {"question": "Which code when the row does not exist?", "answer": "404 Not Found."},
            {"question": "How many cases should you test?", "answer": "Three: no token, expired token, valid token."},
            {"question": "Why avoid copying the check into every handler?", "answer": "One forgotten route is a hole, and dependencies cannot be forgotten."},
        ],
    },
    "Your first test that catches a real bug": {
        "objectives": [
            "Write a test that fails for the right reason before it passes",
            "Test behaviour through the API instead of internal functions",
            "Recognise a test that will break on every refactor",
        ],
        "takeaways": [
            {"title": "Start from the bug", "items": ["Describe the wrong behaviour first.", "Watch the test fail.", "Then fix the code until it passes."]},
            {"title": "Test the edge you expose", "items": ["Call the endpoint, not the private helper.", "Status code and body are the contract.", "Internals should be free to change."]},
            {"title": "Signs of a brittle test", "items": ["It breaks on every refactor.", "It needs three fakes to run.", "It asserts on log lines or timings."]},
        ],
        "resources": [
            {"name": "FastAPI testing", "url": "https://fastapi.tiangolo.com/tutorial/testing/"},
            {"name": "pytest getting started", "url": "https://docs.pytest.org/en/stable/getting-started.html"},
            {"name": "httpx test client", "url": "https://www.python-httpx.org/"},
        ],
        "checks": [
            {"question": "What is the first step of writing a test?", "answer": "Reproduce the bug so the test fails for the right reason."},
            {"question": "What should a test call?", "answer": "The public endpoint, not a private helper."},
            {"question": "What is the contract a test asserts?", "answer": "The status code and the response body."},
            {"question": "What makes a test brittle?", "answer": "Depending on internals, timings or log output."},
            {"question": "Why run the test before the fix?", "answer": "To prove it actually catches the bug."},
            {"question": "What does a test that needs three fakes suggest?", "answer": "It is testing the wrong layer."},
        ],
    },
    "Fixtures and a separate test database": {
        "objectives": [
            "Set up a test database that never touches your development data",
            "Share setup with a fixture instead of copying it into every test",
            "Keep tests independent so their order does not matter",
        ],
        "takeaways": [
            {"title": "Its own database", "items": ["Tests point at a separate database.", "Create the schema at session start.", "Never reuse development data."]},
            {"title": "Fixtures for setup", "items": ["One fixture creates the client.", "Another provides a clean database.", "Setup lives in one place, not in every test."]},
            {"title": "Order must not matter", "items": ["Each test leaves the database as it found it.", "A test that needs another one is a future flake.", "Run the suite in a random order once."]},
        ],
        "resources": [
            {"name": "pytest fixtures", "url": "https://docs.pytest.org/en/stable/how-to/fixtures.html"},
            {"name": "pytest temporary paths", "url": "https://docs.pytest.org/en/stable/how-to/tmp_path.html"},
            {"name": "SQLModel, create tables", "url": "https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/"},
        ],
        "checks": [
            {"question": "Which database should tests use?", "answer": "A separate one, never the development database."},
            {"question": "What is a fixture for?", "answer": "Shared setup, created once and injected where needed."},
            {"question": "Why should test order not matter?", "answer": "An order dependent suite fails for reasons unrelated to the code."},
            {"question": "What happens if a test leaves rows behind?", "answer": "The next run starts from a different state and fails unpredictably."},
            {"question": "Where should the schema be created?", "answer": "Once at the start of the test session."},
            {"question": "What does a flaky test usually depend on?", "answer": "State left by another test, timing or the network."},
        ],
    },
    "Reading a stack trace calmly": {
        "objectives": [
            "Find the line that raised before reading the whole trace",
            "Tell the difference between your error and a library's",
            "Reproduce the failure without running the whole application",
        ],
        "takeaways": [
            {"title": "Read from the bottom up", "items": ["The last frame is where the error was raised.", "The frames above it are who called it.", "Your own file is the one to open first."]},
            {"title": "The type tells you the family", "items": ["AttributeError is usually a typo or a None.", "KeyError is a missing dictionary key.", "TypeError is a value of the wrong shape."]},
            {"title": "Reproduce before fixing", "items": ["Get the failure into a test.", "A fix you cannot reproduce is a guess.", "Only then change the code."]},
        ],
        "resources": [
            {"name": "Python traceback module", "url": "https://docs.python.org/3/library/traceback.html"},
            {"name": "Python built-in exceptions", "url": "https://docs.python.org/3/library/exceptions.html"},
            {"name": "pytest, failing examples", "url": "https://docs.pytest.org/en/stable/how-to/failures.html"},
        ],
        "checks": [
            {"question": "Where does an error originate in a trace?", "answer": "In the last frame, the deepest call."},
            {"question": "Which frame should you open first?", "answer": "The last line of your own code."},
            {"question": "What does an AttributeError usually mean?", "answer": "A typo, or a value that is None."},
            {"question": "What does a KeyError mean?", "answer": "A dictionary key that does not exist."},
            {"question": "What should you do before changing code?", "answer": "Reproduce the failure in a test."},
            {"question": "What does the top of the trace show?", "answer": "Where the call started, not where it failed."},
        ],
    },
    "Write the first test": {
        "objectives": [
            "Pick one endpoint and write a test that fails when validation is removed",
            "Add a fixture that points at the test database",
            "Keep the whole test under one second",
        ],
        "takeaways": [
            {"title": "One behaviour per test", "items": ["Missing date is rejected.", "That is the whole test.", "Do not bundle three assertions about different things."]},
            {"title": "Name it after the behaviour", "items": ["The name should read like a sentence.", "No test_ prefix noise beyond the convention.", "A failing name should explain itself."]},
            {"title": "Fast and offline", "items": ["No network, no sleeps.", "A fresh database per run.", "If it takes seconds, it will be skipped."]},
        ],
        "resources": [
            {"name": "pytest getting started", "url": "https://docs.pytest.org/en/stable/getting-started.html"},
            {"name": "FastAPI testing", "url": "https://fastapi.tiangolo.com/tutorial/testing/"},
            {"name": "pytest fixtures", "url": "https://docs.pytest.org/en/stable/how-to/fixtures.html"},
        ],
        "checks": [
            {"question": "What should the test prove?", "answer": "That validation rejects a missing field."},
            {"question": "How should the test be named?", "answer": "After the behaviour it checks, as a readable sentence."},
            {"question": "How long should one test take?", "answer": "Well under a second."},
            {"question": "What should the test never depend on?", "answer": "The network, sleeps or another test."},
            {"question": "What proves the test is meaningful?", "answer": "It fails when the validation is removed."},
            {"question": "How many behaviours should one test cover?", "answer": "One."},
        ],
    },
    "Docker without copying a tutorial": {
        "objectives": [
            "Write a Dockerfile for an API without layers you cannot explain",
            "Run the app and the database together with compose",
            "Keep the image small enough to rebuild without waiting",
        ],
        "takeaways": [
            {"title": "One process per container", "items": ["The API is one container.", "The database is another.", "Do not run both in one image."]},
            {"title": "Order the layers", "items": ["Copy requirements and install first.", "Copy the source after.", "A code change then reuses the dependency layer."]},
            {"title": "Small and boring", "items": ["Start from a slim base image.", "No build tools in the final image.", "If you cannot explain a line, delete it."]},
        ],
        "resources": [
            {"name": "Dockerfile reference", "url": "https://docs.docker.com/reference/dockerfile/"},
            {"name": "Compose file reference", "url": "https://docs.docker.com/compose/compose-file/"},
            {"name": "Python Docker best practices", "url": "https://docs.docker.com/language/python/"},
        ],
        "checks": [
            {"question": "How many processes per container?", "answer": "One."},
            {"question": "Why copy requirements before the code?", "answer": "So the dependency layer stays cached between code changes."},
            {"question": "Where does the database run?", "answer": "In its own container, not inside the API image."},
            {"question": "Why use a slim base image?", "answer": "Smaller image, fewer packages to keep patched."},
            {"question": "What should the final image exclude?", "answer": "Build tools and anything only needed to compile dependencies."},
            {"question": "What rebuilds quickly after a code change?", "answer": "The source layer, because dependencies are already cached."},
        ],
    },
    "Environment variables and secrets": {
        "objectives": [
            "Move configuration out of the code and into the environment",
            "Keep secrets out of images, repositories and logs",
            "Fail at startup when a required variable is missing",
        ],
        "takeaways": [
            {"title": "Config lives outside", "items": ["Anything that changes per machine is a variable.", "The code reads it, never hardcodes it.", "Defaults belong in code only when they are safe."]},
            {"title": "Secrets are not files you commit", "items": ["A .env file stays local.", "Commit an example with empty values.", "Rotate anything that ever shipped."]},
            {"title": "Fail fast, fail loud", "items": ["Read every required variable at startup.", "Stop the app if one is missing.", "Name the variable in the error."]},
        ],
        "resources": [
            {"name": "Twelve factor app, config", "url": "https://12factor.net/config"},
            {"name": "pydantic-settings", "url": "https://docs.pydantic.dev/latest/concepts/pydantic_settings/"},
            {"name": "OWASP secrets management", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"},
        ],
        "checks": [
            {"question": "What decides whether a value is configuration?", "answer": "Whether it changes between environments."},
            {"question": "Should a .env file be committed?", "answer": "No. Commit an example file with empty values instead."},
            {"question": "What should happen when a required variable is missing?", "answer": "The application should refuse to start and name the variable."},
            {"question": "Where do secrets belong in production?", "answer": "In the platform's secret store or environment, never in the image."},
            {"question": "What should the code do with a configuration value?", "answer": "Read it from the environment, never hardcode it."},
            {"question": "When should a default value be used?", "answer": "Only when the default is safe in every environment."},
        ],
    },
    "Deploying behind a reverse proxy": {
        "objectives": [
            "Put the API behind a proxy and keep the real client IP",
            "Serve HTTPS without changing application code",
            "Roll out a change without dropping requests",
        ],
        "takeaways": [
            {"title": "The proxy owns TLS", "items": ["Certificates live on the proxy.", "The app stays on plain HTTP.", "Only the proxy is exposed to the internet."]},
            {"title": "Forward the right headers", "items": ["Send the original host and protocol.", "Pass the client IP in the forwarded header.", "Trust those headers only from the proxy."]},
            {"title": "Deploy without a gap", "items": ["Start the new process before stopping the old.", "Send traffic only when the health check passes.", "Keep the previous version ready to bring back."]},
        ],
        "resources": [
            {"name": "Nginx reverse proxy", "url": "https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/"},
            {"name": "MDN, X-Forwarded-For", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For"},
            {"name": "Let's Encrypt", "url": "https://letsencrypt.org/docs/"},
        ],
        "checks": [
            {"question": "Where does TLS terminate?", "answer": "At the reverse proxy."},
            {"question": "Why must the original host header be forwarded?", "answer": "Absolute URLs and redirects are built from it."},
            {"question": "Which header carries the original client IP?", "answer": "X-Forwarded-For, set by the proxy."},
            {"question": "Should the app be reachable from the internet?", "answer": "No, only the proxy should be."},
            {"question": "What should happen before traffic switches to a new version?", "answer": "The health check must pass."},
            {"question": "Why keep the previous version available?", "answer": "So a bad deploy can be rolled back in seconds."},
        ],
    },
    "Backups, monitoring and what to do when it breaks": {
        "objectives": [
            "Schedule a backup you have actually restored once",
            "Watch the three signals that tell you something is wrong",
            "Write the first five minutes of an incident plan",
        ],
        "takeaways": [
            {"title": "A backup you never restored is a rumour", "items": ["Schedule the dump.", "Restore it somewhere real.", "Write down how long it took."]},
            {"title": "Three signals first", "items": ["Error rate.", "Response time.", "Disk space."]},
            {"title": "The first five minutes", "items": ["Say what is broken and who is looking.", "Stop making changes you cannot explain.", "Write the timeline as it happens."]},
        ],
        "resources": [
            {"name": "PostgreSQL backup and restore", "url": "https://www.postgresql.org/docs/current/backup.html"},
            {"name": "Prometheus, alerting", "url": "https://prometheus.io/docs/alerting/latest/overview/"},
            {"name": "Google SRE, incident management", "url": "https://sre.google/sre-book/managing-incidents/"},
        ],
        "checks": [
            {"question": "What makes a backup trustworthy?", "answer": "Having restored it successfully at least once."},
            {"question": "Which three signals should you watch first?", "answer": "Error rate, response time and disk space."},
            {"question": "What is the first thing to do in an incident?", "answer": "State what is broken and who is on it."},
            {"question": "Why avoid unexplained changes during an outage?", "answer": "They add noise and make the cause harder to find."},
            {"question": "When should the runbook be written?", "answer": "Before the outage, while everything is calm."},
            {"question": "What should be recorded as an incident happens?", "answer": "A timestamped timeline of what was tried and what changed."},
        ],
    },
}

COURSES = [
    {
        "name": "Backend Engineering with Python",
        "description": "Six weeks building one API from an empty folder to something running on a server. We start with git and a clean project layout, then move through requests, a real database, auth, tests and deployment. You finish with a service you can show and explain. Bring a laptop with Python installed.",
        "about": "This course exists because I kept meeting people who could write Python but froze the moment a project had to leave their laptop. Six weeks, one project, built in the open. We start with an empty folder in week one and finish with a service running on a server you can point people to. There is no separate theory module. Everything we cover shows up in the code you are already writing, which is why the lessons are short and the project is not.\n\nEach week follows the same rhythm: one lesson to watch, one exercise on the project, then a review. I record on Monday, you send the exercise by Thursday, and I read every pull request on Friday. That review is the part people say changed how they work, because I end up commenting on the same three things most of you get wrong the first time: error handling, naming, and the shape of a function. It is not a grading system. It is a second pair of eyes while the code is still small enough to fix in an afternoon.\n\nBring Python basics: functions, lists, dictionaries, and the willingness to read an error message out loud. You do not need backend experience, Docker knowledge or a cloud account. Week three is where most people slow down, because databases punish guessing, and I would rather tell you that now than pretend the whole thing is easy. If you have shipped something small and were not entirely sure why it worked, you are exactly who this is for.\n\nWe use FastAPI, Postgres, SQLModel and pytest, with git from the first commit. None of those choices are fashionable accidents. FastAPI keeps the request and response definitions next to the route, Postgres is what you will meet in most jobs around here, and pytest gives you a failing test you can actually read. If your team uses something else, the ideas transfer. The tooling is the least important thing you will take away.\n\nBy the end you have a repository with real history, tests that catch regressions, a README another developer can follow, and a deployment you can explain without hand waving. You also get the parts that never make it into a syllabus: how to review someone else's work kindly, how to ask a question that actually gets answered, and how to tell whether a bug is in your code or in your assumptions. The community stays open for a month after the course ends, and the people who finish tend to keep reviewing each other's work long after that.",
        "learnings": [
            ("Build an API from an empty folder all the way to a live deploy", "\U0001F6E0"),
            ("Write migrations that are safe to run twice, and roll one back", "\U0001F5C4"),
            ("Add authentication and role checks you can explain line by line, so no stranger can read another user's data", "\U0001F510"),
            ("Test and debug your own code before a user finds it, using the error messages you will meet in week three", "\U0001F9EA"),
        ],
        "tags": "python, backend, api, fastapi, postgres, git",
        "access": "PAID",
        "price": 4500,
    },
    {
        "name": "Figma for Absolute Beginners",
        "description": "A slow walk through the interface for people who have never opened Figma. Frames, groups, auto layout and the five shortcuts that do half the work. Nothing else. That is the whole point.",
        "about": "I made this for my aunt who runs a small bakery and wanted to mock up a website. It turned into something useful for everyone. No theory, no case studies, just the tool and a lot of practice files you can break.",
        "learnings": [
            ("Move around Figma without hunting for buttons, and know which panel holds the setting you are looking for", "\U0001F5B1"),
            ("Use frames and groups the right way, so resizing one thing does not quietly break the rest of the screen", "\U0001F4D0"),
            ("Understand auto layout at a basic level and build a card that grows with its content instead of against it", "\U0001F4CF"),
            ("Share a file with someone else, leave a useful comment and hand over an edit link without giving away your account", "\U0001F517"),
        ],
        "tags": "figma, beginner, basics",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Design Systems That Survive a Team",
        "description": "Most design systems die because nobody maintains them. This course covers the boring parts: naming, versioning, who decides, and how to say no to a new button variant. We rebuild a small system from a mess.",
        "about": "Written for the person who inherits a Figma file with forty two button styles and no documentation. We work through tokens, then components, then the process that keeps it alive after the launch. Bring your worst file.",
        "learnings": [
            ("Turn a messy file into a named system, with a clear owner, a changelog and one place where decisions live", "\U0001F5C2"),
            ("Choose tokens instead of endless styles, so a colour change happens once instead of in forty frames", "\U0001F3A8"),
            ("Document decisions people will actually read, in short notes attached to the component they explain", "\U0001F4D8"),
            ("Handle requests for new variants without losing control, using a process the whole team already agreed to", "\U0001F6E1"),
        ],
        "tags": "design systems, tokens, process",
        "access": "PAID",
        "price": 6000,
    },
    {
        "name": "Typography for Screens",
        "description": "Type is most of your interface. We look at real screens, break them, and rebuild them with two weights and a sane scale. No font history lecture, I promise.",
        "about": "Includes a session on Arabic and French typesetting, which every local project needs and almost nobody tests. You will leave with a small checklist you can run on any screen.",
        "learnings": [
            ("Set a type scale you can defend in a review, with sizes, weights and line heights that survive real screens", "\U0001F4CF"),
            ("Fix line length and line height quickly, using a short checklist instead of guessing until it looks right", "\U0001F4D6"),
            ("Pair Arabic and Latin text without it looking wrong, including numbers, punctuation and right to left alignment", "\U0001F30D"),
            ("Audit a real page in ten minutes and name the three changes that would improve it the most", "\U0001F50D"),
        ],
        "tags": "typography, layout, rtl",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Motion Design Basics with After Effects",
        "description": "Four weekends of keyframes, easing and one small reel. We animate an icon, a card and a loading state, then export everything for the web at a size that does not kill the page.",
        "about": "This is not a clever transitions showreel course. It is about making small animations that explain what the interface is doing. You need After Effects or a free alternative and some patience.",
        "learnings": [
            ("Keyframe without fighting the timeline, and understand why an animation suddenly jumps or drifts", "\U0001F39E"),
            ("Pick easing that matches the interaction instead of the default curve everyone leaves in place", "\U0001F3AF"),
            ("Export small files for the web that still load quickly on a phone with a slow connection", "\U0001F4E6"),
            ("Cut a thirty second reel from your own work, with a beginning, an end and no filler in between", "\U0001F3AC"),
        ],
        "tags": "motion, after effects, animation",
        "access": "PAID",
        "price": 4000,
    },
    {
        "name": "Front End Foundations with React",
        "description": "Components, state and the small amount of CSS you actually need. We build a dashboard that pulls from a fake API and handles loading, empty and error states without hand waving them away.",
        "about": "If you finished a tutorial and cannot build anything alone, this is the gap. We write real code every session and I review pull requests. You need basic HTML and a little JavaScript.",
        "learnings": [
            ("Write components that are easy to delete, with props that describe intent instead of whatever the parent passed down", "\U0001F9E9"),
            ("Manage state without reaching for a library on day one, and know the moment a library is actually worth it", "\U0001F504"),
            ("Handle loading, empty and error views so a slow network never leaves the screen blank or the user guessing", "\U0001F6A7"),
            ("Ship a small app to a real URL and debug it in production when something works locally but not there", "\U0001F680"),
        ],
        "tags": "react, javascript, frontend",
        "access": "PAID",
        "price": 5500,
    },
    {
        "name": "Python for Everyday Automation",
        "description": "Rename a hundred files, pull numbers from a PDF, send a weekly summary. Small scripts that save you an hour every week, not a machine learning project. You bring a folder you are tired of touching by hand, we turn it into three lines you can run again tomorrow.",
        "about": "Built from tasks people actually asked me to automate at work. Each lesson ends with a script you can copy and change. No computer science degree required and no virtual environment sermon.",
        "learnings": [
            ("Read and write files without fear, including CSV, JSON and the folder structure somebody else made", "\U0001F4C1"),
            ("Scrape a page politely, respect the rate limits and store what you collect in a form you can reuse later", "\U0001F578"),
            ("Automate a boring spreadsheet task and run it again next month without rewriting the whole script", "\U0001F4CA"),
            ("Schedule a script on your own machine so it runs while you sleep and tells you when something fails", "\u23F0"),
        ],
        "tags": "python, automation, scripting",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Data Analysis with Pandas",
        "description": "Load a messy CSV, clean it, group it, and answer one question your boss asked. We use a real export from a small shop with duplicate rows and three date formats.",
        "about": "Most courses use perfect data. This one starts with the mess you get on a Tuesday. You need Python basics and the willingness to read an error message out loud.",
        "learnings": [
            ("Inspect a dataframe before trusting it, checking shape, types and the rows that quietly went missing", "\U0001F50E"),
            ("Clean duplicates and broken dates without losing the rows you actually need for the answer", "\U0001F9F9"),
            ("Group and summarise for a real question, then explain the number to someone who will challenge it", "\U0001F4C8"),
            ("Save a chart someone can read at a glance, with a title that says what it shows and no decoration", "\U0001F4C9"),
        ],
        "tags": "pandas, data, python",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "SQL That Answers Real Questions",
        "description": "Joins, grouping and the difference between a query that runs and a query that is right. We work on a small shop database and answer questions the owner actually has.",
        "about": "You will write around forty queries in this course. Some of them will be wrong the first time. That is the lesson. Postgres is used throughout but the ideas transfer.",
        "learnings": [
            ("Join tables without multiplying rows by accident, and spot a join that looks right but returns wrong numbers", "\U0001F517"),
            ("Use group by and having for real reporting, including the totals people ask for on a Monday morning", "\U0001F4CA"),
            ("Read a query plan at a basic level and tell which part of your query is doing all of the work", "\U0001F9EE"),
            ("Debug a wrong number before sending it to anyone, by building the query in small checkable steps", "\U0001F6A8"),
        ],
        "tags": "sql, postgres, data",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Mobile Apps with React Native",
        "description": "One codebase, two stores, a lot of small screen problems. We build a simple habit tracker, handle offline storage, and get it running on a real phone before the last session.",
        "about": "The course assumes React basics. We spend time on the parts tutorials skip: navigation back buttons, keyboard overlap, and what happens when the network dies in a lift.",
        "learnings": [
            ("Set up a project that builds on both platforms without a week of configuration and version guessing", "\U0001F4F1"),
            ("Handle navigation and back gestures so the phone's own button never closes the app on the user", "\U0001F500"),
            ("Store data offline and sync later, including what to do when two devices edit the same record", "\U0001F4BE"),
            ("Prepare a build for testing on a real device and get it into someone else's hands the same day", "\U0001F527"),
        ],
        "tags": "react native, mobile, offline",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Backend APIs with FastAPI",
        "description": "Routes, validation, authentication and a database that does not fall over. We build the API behind a small booking app and test it with real requests.",
        "about": "Aimed at people who can write Python but have never shipped an endpoint. We cover the mistakes I see in code reviews every month, including mine.",
        "learnings": [
            ("Design routes people can guess, with names, status codes and errors that make sense without documentation", "\U0001F6E4"),
            ("Validate input at the edge so bad data never reaches the database or a colleague's inbox", "\u2705"),
            ("Add authentication without inventing your own scheme, using the patterns that already survived audits", "\U0001F510"),
            ("Write tests that catch regressions, covering the endpoints your users actually call every day", "\U0001F9EA"),
        ],
        "tags": "fastapi, python, backend",
        "access": "PAID",
        "price": 5000,
    },
    {
        "name": "Photography for Product Teams",
        "description": "How to shoot a product on a table with one window and a sheet of paper. We cover light, angles and the three edits that make a photo usable on a shop page.",
        "about": "No studio, no expensive lens. The first lesson is shot on a phone to prove the point. Bring any object you can carry.",
        "learnings": [
            ("Use window light instead of buying a softbox, and know which hour of the day gives the cleanest shadow", "\U0001F4A1"),
            ("Frame a product consistently across a catalogue, so forty shots look like one person took them", "\U0001F4F7"),
            ("Clean up a photo without making it fake, keeping texture and colour close to what the buyer receives", "\U0001F5BC"),
            ("Export sizes for web and marketplaces, with the right dimensions and weight for each one", "\U0001F4E4"),
        ],
        "tags": "photography, product, ecommerce",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Video Editing in DaVinci Resolve",
        "description": "Cut a five minute interview into something people finish. We work on timing, audio cleanup and simple colour, then export for YouTube and for a phone screen.",
        "about": "The free version of Resolve is enough for everything here. We use real footage from a small interview shoot, including the awkward parts.",
        "learnings": [
            ("Cut for pace instead of cutting for cuts, and know when silence is doing more work than a transition", "\u2702"),
            ("Fix bad audio without plugins, using the three controls that solve most noisy room problems", "\U0001F3A7"),
            ("Balance colour across two cameras so an interview does not change shade every time it cuts", "\U0001F3A8"),
            ("Export settings for each platform, sized so the file does not look soft after the upload", "\U0001F4E4"),
        ],
        "tags": "video, resolve, editing",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Copywriting for Interfaces",
        "description": "Buttons, errors, empty states and the one sentence that explains a complicated product. Short course, a lot of rewriting. We work on real screens, keep the before and after next to each other and finish with a checklist you can reuse on the next project.",
        "about": "We take real screens from local products and rewrite the text together. You will hate your first drafts by the end, which is the goal.",
        "learnings": [
            ("Write buttons people understand on first read, using verbs the user would say out loud themselves", "\U0001F518"),
            ("Make error messages useful instead of polite, telling the user what happened and what to do next", "\u26A0"),
            ("Fill an empty state with something helpful, so a new account is not a dead end on day one", "\U0001F4ED"),
            ("Cut a paragraph down to one sentence without losing the part that actually matters", "\u2702"),
        ],
        "tags": "copywriting, ux writing, content",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Accessibility in Practice",
        "description": "Keyboard navigation, focus states, contrast and screen reader basics. We audit three local sites and fix the worst problems live. You leave with a short checklist and the arguments to use when someone asks why it matters before launch.",
        "about": "No compliance lecture. We use a keyboard and a screen reader and see what breaks. Most of the fixes are small and cheap, which is the part nobody tells you.",
        "learnings": [
            ("Navigate your own product with only a keyboard, and find the three places where focus disappears", "\u2328"),
            ("Write focus styles people can see, without making every button look permanently selected", "\U0001F440"),
            ("Check contrast without guessing, using the ratio and the exceptions that actually matter", "\U0001F3A8"),
            ("Label forms so screen readers stay calm, including errors announced at the right moment", "\U0001F5E3"),
        ],
        "tags": "accessibility, audit, forms",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Freelancing for Designers",
        "description": "Pricing, contracts, scope creep and the awkward message you have to send when a client stops replying. Everything I learned the hard way in four years.",
        "about": "Most of this course is process, not design. We write a proposal together, set a rate you can say out loud, and build a small system for invoices and follow ups.",
        "learnings": [
            ("Price a project without guessing, by working backwards from the hours and the living you need", "\U0001F4B0"),
            ("Write a short proposal that gets a yes, with a scope, a number and a date on the first page", "\U0001F4DD"),
            ("Handle scope creep before it eats the month, using a sentence you can copy without sounding rude", "\U0001F6E1"),
            ("Ask for money without apologising, including the follow up for an invoice thirty days late", "\U0001F4AC"),
        ],
        "tags": "freelance, business, pricing",
        "access": "PUBLIC",
        "price": None,
    },
    {
        "name": "Advanced Figma Prototyping",
        "description": "Variables, conditional logic and prototypes that behave like the real thing. For people who already know the basics and want the parts nobody documents.",
        "about": "Draft course. Still recording the last two modules. The first four are ready and I am looking for people to break them.",
        "learnings": [
            ("Use variables for themes and states, so a prototype switches modes without forty duplicate frames", "\U0001F9EA"),
            ("Build a prototype with real conditions, including the empty and error paths nobody bothers to show", "\U0001F500"),
            ("Keep a complex file fast, and know which layer is responsible when the editor starts to lag", "\u26A1"),
            ("Hand off logic to developers clearly, with annotated flows instead of a call that could be an email", "\U0001F91D"),
        ],
        "tags": "figma, prototyping, variables",
        "access": "PUBLIC",
        "price": None,
        "draft": True,
    },
    {
        "name": "Design Leadership",
        "description": "For the designer who suddenly has three people reporting to them and no idea what to do on Monday. Hiring, feedback, and protecting the team from chaos.",
        "about": "Draft. Notes are in place, the first two lessons are recorded. This one needs more interviews before it is honest.",
        "learnings": [
            ("Run a hiring process that is fair, with a scorecard, the same questions and a decision made on evidence", "\U0001F91D"),
            ("Give feedback people can use, in a way that changes the work without changing how they feel about you", "\U0001F4AC"),
            ("Say no to stakeholders without a fight, using trade offs they can take to their own manager", "\U0001F6E1"),
            ("Plan a quarter that survives contact with reality, and re plan without calling it a failure", "\U0001F4C5"),
        ],
        "tags": "leadership, management, teams",
        "access": "PUBLIC",
        "price": None,
        "draft": True,
    },
    {
        "name": "Intro to 3D with Blender",
        "description": "Modelling, lighting and one rendered product shot. Slow pace, no shortcut worship, plenty of saving your file. We finish with a render you can put on a landing page and the settings written down so you can repeat it later.",
        "about": "Draft. I am rebuilding the modelling lessons because the first version moved too fast. Feedback welcome from anyone who tries it.",
        "learnings": [
            ("Model a simple object cleanly, with topology that holds up when someone else opens the file", "\U0001F9F1"),
            ("Light a scene with three lights and understand what each one is doing to the product", "\U0001F4A1"),
            ("Render without waiting all night, using the settings that matter and ignoring the rest", "\U0001F5A5"),
            ("Export a turntable for a portfolio that loads on a page without stalling the browser", "\U0001F3AC"),
        ],
        "tags": "blender, 3d, rendering",
        "access": "PUBLIC",
        "price": None,
        "draft": True,
    },
]

COURSE_META = {
    "Backend Engineering with Python": {
        "difficulty": "Intermediate",
        "duration": "6h 20m",
        "video_hours": 6,
        "resources_count": 5,
        "has_certificate": True,
        "lessons_count": 26,
        "requirements": [
            "Python 3.11 or newer installed, plus the confidence to run a single file from the terminal",
            "A code editor you already like — VS Code, PyCharm or Neovim, we genuinely do not care which",
            "About one hour a day for six weeks, on a laptop you are allowed to install packages on",
        ],
        "audience_for": [
            "Python beginners who have written a few scripts and want to build real backend projects",
            "Self-taught developers looking for a structured path through backend engineering",
            "Career switchers moving into web development with some coding experience",
        ],
        "audience_not_for": [
            "Experienced backend engineers who already ship APIs in production",
            "Complete programming beginners — take an intro to Python course first",
        ],
        "instructor_title": "Founder and backend developer",
        "instructor_bio": "Builds APIs in Python and Postgres. Has broken a database in production twice and learned more from that than from any tutorial.",
    },
    "Figma for Absolute Beginners": {
        "difficulty": "Beginner",
        "duration": "2h 10m",
        "video_hours": 2,
        "resources_count": 4,
        "has_certificate": True,
        "lessons_count": 12,
        "requirements": [
            "A free Figma account and a browser that can keep up with it — no paid plan needed at any point",
            "A mouse or a trackpad you are comfortable with, because the shortcuts rely on precise clicking",
        ],
        "instructor_title": "Product designer",
        "instructor_bio": "Teaches Figma to people who have never opened it. Still draws wireframes on paper first.",
    },
    "Design Systems That Survive a Team": {
        "difficulty": "Advanced",
        "duration": "4h 45m",
        "video_hours": 4,
        "resources_count": 6,
        "has_certificate": True,
        "lessons_count": 18,
        "requirements": [
            "Comfort with Figma or a similar design tool, including components, variants and auto layout",
            "A messy file you are allowed to fix, or the sample library we ship with the course",
        ],
        "instructor_title": "Design systems lead",
        "instructor_bio": "Spends most weeks cleaning up component libraries other people abandoned.",
    },
    "Typography for Screens": {
        "difficulty": "Beginner",
        "duration": "3h 05m",
        "video_hours": 3,
        "resources_count": 3,
        "has_certificate": True,
        "lessons_count": 14,
        "requirements": [
            "Any modern browser and a page you are allowed to redesign, or a clear screenshot of one",
            "No type design background needed, though a little CSS knowledge makes the exercises faster",
        ],
        "instructor_title": "Typographer",
        "instructor_bio": "Sets type for screens and print, and has strong opinions about line height that she will share.",
    },
    "Motion Design Basics with After Effects": {
        "difficulty": "Beginner",
        "duration": "4h 30m",
        "video_hours": 4,
        "resources_count": 5,
        "has_certificate": True,
        "lessons_count": 16,
        "requirements": [
            "After Effects or a free alternative such as Cavalry or Rive, the ideas carry across all of them",
            "A short clip or an icon you want to animate, and the patience to watch it frame by frame",
        ],
        "instructor_title": "Motion designer",
        "instructor_bio": "Animates interfaces for product teams. Believes most animations should be shorter.",
    },
    "Front End Foundations with React": {
        "difficulty": "Intermediate",
        "duration": "7h 15m",
        "video_hours": 7,
        "resources_count": 6,
        "has_certificate": True,
        "lessons_count": 24,
        "requirements": [
            "JavaScript basics, including arrays, objects and functions — we will not teach the language from zero",
            "Node and npm installed, plus a browser with working developer tools",
        ],
        "instructor_title": "Front end developer",
        "instructor_bio": "Writes React every day and still reads the docs before every release.",
    },
    "Python for Everyday Automation": {
        "difficulty": "Beginner",
        "duration": "3h 40m",
        "video_hours": 3,
        "resources_count": 4,
        "has_certificate": True,
        "lessons_count": 15,
        "requirements": [
            "Python installed and able to run a single file from the terminal, nothing more advanced than that",
            "A folder of files you would like to stop renaming by hand, and one repetitive task you genuinely hate",
        ],
        "instructor_title": "Automation teacher",
        "instructor_bio": "Turns repeated office tasks into small scripts and keeps a notebook of every shortcut learned the hard way.",
    },
    "Data Analysis with Pandas": {
        "difficulty": "Intermediate",
        "duration": "5h 10m",
        "video_hours": 5,
        "resources_count": 5,
        "has_certificate": True,
        "lessons_count": 19,
        "requirements": [
            "Python basics and Pandas installed, or a notebook environment where you can install it quickly",
            "A spreadsheet you actually use at work, or the messy export we provide with the lessons",
        ],
        "instructor_title": "Data analyst",
        "instructor_bio": "Cleans other people spreadsheets for a living and writes down every fix.",
    },
    "SQL That Answers Real Questions": {
        "difficulty": "Intermediate",
        "duration": "4h 25m",
        "video_hours": 4,
        "resources_count": 4,
        "has_certificate": True,
        "lessons_count": 17,
        "requirements": [
            "Access to a SQL database — Postgres, MySQL or SQLite all work with the ideas here",
            "A basic understanding of tables, rows and columns, even if your queries stop at select star",
        ],
        "instructor_title": "Data engineer",
        "instructor_bio": "Writes SQL that runs on Monday morning without waking anyone up.",
    },
    "Mobile Apps with React Native": {
        "difficulty": "Intermediate",
        "duration": "6h 50m",
        "video_hours": 6,
        "resources_count": 6,
        "has_certificate": True,
        "lessons_count": 22,
        "requirements": [
            "React experience, including hooks, components and enough JavaScript to read a stack trace",
            "A phone for testing, plus Expo installed and a free account on both app stores",
        ],
        "instructor_title": "Mobile developer",
        "instructor_bio": "Ships React Native apps to both stores and complains about both review processes equally.",
    },
    "Backend APIs with FastAPI": {
        "difficulty": "Intermediate",
        "duration": "5h 30m",
        "video_hours": 5,
        "resources_count": 5,
        "has_certificate": True,
        "lessons_count": 20,
        "requirements": [
            "Python basics and a terminal you are not afraid of, including what a virtual environment does",
            "Postgres or a way to run it — Docker is fine, and we show you the exact command",
        ],
        "instructor_title": "Backend developer",
        "instructor_bio": "Designs APIs that other teams can integrate without a call.",
    },
    "Photography for Product Teams": {
        "difficulty": "Beginner",
        "duration": "3h 15m",
        "video_hours": 3,
        "resources_count": 3,
        "has_certificate": True,
        "lessons_count": 13,
        "requirements": [
            "A camera or a recent phone, plus one product you are allowed to photograph for a few hours",
            "A table near a window, and a sheet of white paper you do not mind cutting up",
        ],
        "instructor_title": "Product photographer",
        "instructor_bio": "Photographs products for small shops and teaches teams to do it themselves.",
    },
    "Video Editing in DaVinci Resolve": {
        "difficulty": "Beginner",
        "duration": "4h 05m",
        "video_hours": 4,
        "resources_count": 4,
        "has_certificate": True,
        "lessons_count": 16,
        "requirements": [
            "DaVinci Resolve installed, the free version is enough for everything in this course",
            "Footage you are allowed to cut, or the interview clips we provide to follow along",
        ],
        "instructor_title": "Video editor",
        "instructor_bio": "Cuts short films and product videos. Says most editing is deciding what to remove.",
    },
    "Copywriting for Interfaces": {
        "difficulty": "Beginner",
        "duration": "2h 35m",
        "video_hours": 2,
        "resources_count": 3,
        "has_certificate": True,
        "lessons_count": 11,
        "requirements": [
            "Nothing beyond a browser — a free account on any product you find confusing is useful",
            "One interface whose text annoys you, ideally one you are allowed to rewrite",
        ],
        "instructor_title": "UX writer",
        "instructor_bio": "Writes interface copy for products that cannot afford to confuse anyone.",
    },
    "Accessibility in Practice": {
        "difficulty": "Intermediate",
        "duration": "3h 55m",
        "video_hours": 3,
        "resources_count": 5,
        "has_certificate": True,
        "lessons_count": 14,
        "requirements": [
            "A browser and a site you are allowed to test, or the sample pages included with the course",
            "A keyboard and a free screen reader such as NVDA or VoiceOver, both are enough",
        ],
        "instructor_title": "Accessibility specialist",
        "instructor_bio": "Audits products and fixes what the audit finds. Prefers small changes that ship to big reports.",
    },
    "Freelancing for Designers": {
        "difficulty": "Beginner",
        "duration": "2h 50m",
        "video_hours": 2,
        "resources_count": 4,
        "has_certificate": True,
        "lessons_count": 12,
        "requirements": [
            "Some client work behind you, even one small project you were actually paid for",
            "A way to send invoices, and the courage to look at your own numbers honestly",
        ],
        "instructor_title": "Freelance designer",
        "instructor_bio": "Freelances full time and keeps every contract that went well, plus a few that did not.",
    },
    "Advanced Figma Prototyping": {
        "difficulty": "Advanced",
        "duration": "3h 30m",
        "video_hours": 3,
        "resources_count": 3,
        "has_certificate": True,
        "lessons_count": 13,
        "requirements": [
            "Solid Figma skills, including components, variants and auto layout without looking anything up",
            "A flow you want to prototype, or one of the two sample products we provide",
        ],
        "instructor_title": "Product designer",
        "instructor_bio": "Prototypes interactions before writing a line of code, which saves everyone a sprint.",
    },
    "Design Leadership": {
        "difficulty": "Advanced",
        "duration": "2h 40m",
        "video_hours": 2,
        "resources_count": 2,
        "has_certificate": False,
        "lessons_count": 9,
        "requirements": [
            "A few years of team experience, or a team that is about to form around you",
            "A problem you are currently avoiding — bring the actual one, not a hypothetical",
        ],
        "instructor_title": "Design manager",
        "instructor_bio": "Runs a small design team and spends more time on process than on pixels.",
    },
    "Intro to 3D with Blender": {
        "difficulty": "Beginner",
        "duration": "5h 00m",
        "video_hours": 5,
        "resources_count": 4,
        "has_certificate": True,
        "lessons_count": 18,
        "requirements": [
            "Blender installed, version four or newer, with about ten gigabytes of free disk space",
            "A machine with a real graphics card if possible — integrated graphics work, just slower",
        ],
        "instructor_title": "3D artist",
        "instructor_bio": "Makes 3D product renders for small studios and teaches the shortcuts that matter.",
    },
}

COURSE_NICHES = {
    "Backend Engineering with Python": "coding",
    "Figma for Absolute Beginners": "design",
    "Design Systems That Survive a Team": "design",
    "Typography for Screens": "design",
    "Motion Design Basics with After Effects": "video",
    "Front End Foundations with React": "coding",
    "Python for Everyday Automation": "coding",
    "Data Analysis with Pandas": "coding",
    "SQL That Answers Real Questions": "coding",
    "Mobile Apps with React Native": "coding",
    "Backend APIs with FastAPI": "coding",
    "Photography for Product Teams": "photography",
    "Video Editing in DaVinci Resolve": "video",
    "Copywriting for Interfaces": "writing",
    "Accessibility in Practice": "design",
    "Freelancing for Designers": "business and career",
    "Advanced Figma Prototyping": "design",
    "Design Leadership": "business and career",
    "Intro to 3D with Blender": "video",
}

COURSE_UPDATES = [
    ("Module 4 is live", "Three lessons on auth and one where we fix a broken login together. Push your version to the community and I will review the first ten."),
    ("Live session moved to Thursday", "Same time, same link. I have a dentist appointment on Wednesday and I am not brave enough to reschedule both."),
    ("New practice repository", "I added the messy project from week 3 so you can practise cleaning up the migrations. It is in the resources tab, no need to download anything else."),
    ("Small fix in lesson 7", "The link to the Postgres setup guide was broken. It points somewhere useful now. Thanks to the three people who told me."),
    ("Extra office hours on Sunday", "For anyone who fell behind. Bring one endpoint you are stuck on, not five."),
    ("Recording of the live debugging session", "Up for the next two weeks. The part about reading the stack trace starts around minute twelve."),
    ("Assignment deadline moved", "You get three extra days. Use them to actually finish instead of rushing at midnight."),
    ("New example added", "A booking API from a real project, with the client notes still in the comments. Table names removed."),
    ("Course notes are now downloadable", "One PDF, no email required. Print it if that helps you."),
    ("I am answering questions in the community today", "All day, between meetings. Ask anything about the tests part."),
    ("Week 5 repository updated", "Fixed the test fixtures that were pointing at the old database name. If your tests fail, pull the latest version."),
    ("Thank you for the feedback", "Eleven of you said the pacing was too fast in week 3. I split that lesson into two and re recorded it."),
    ("Guest session next Tuesday", "A friend who runs backend at a payments company is joining to talk about migrations and how they roll one back in production. Bring your worst question."),
    ("Small change to the final project", "You can now deploy the project you already built instead of starting a new one. Some of you clearly wanted that."),
    ("Subtitles added", "English and French, done by hand so expect a few typos. Tell me if you spot one."),
    ("New lesson on error messages", "Short one, twelve minutes. It is the part everyone skips and then regrets when a real user hits it."),
    ("Practice review", "Post one repository and review the person above you. Be specific, be kind, no compliments without a reason."),
    ("Repository clean up", "I removed three old resources that were outdated. If you were using one, tell me and I will put it back."),
    ("Live build this Friday", "We add user accounts to the project from scratch, start to finish, mistakes included."),
    ("Certificate request", "If you finished everything, the certificate is in your progress page. If it is missing, message me."),
    ("Week 2 is the hardest one", "Every cohort says it. Push through, week 3 feels easier once requests start making sense."),
    ("New community thread", "I opened a thread for code reviews. One repository per person, I will comment on all of them."),
    ("Audio fixed", "Lesson 4 had a hum in the background. Re uploaded with the noise gone."),
    ("Short survey", "Three questions about the course pace. Takes a minute and changes what I record next."),
    ("See you next cohort", "This group finishes on Sunday. I am keeping the community open for another month."),
]

COMMUNITIES = [
    ("Backend Engineering with Python", "Ask about the course, post your repository when you get stuck, and help the person below you. A screenshot of the error is welcome, the full log is better. If you solved something last week, write it up so the next person finds it."),
    ("Show Your Work", "Finished something? Small or big, put it here. Links are fine, screenshots are better. Tell us what it does, who it is for and what you would change with another week. Honest notes get more replies than polished shots."),
    ("Career Talk", "First job, switching fields, interviews, salaries. Real numbers help more than motivational posts. If you just signed an offer, share the range and the questions you were asked. If you are still looking, say which stage keeps blocking you."),
    ("Freelance Lounge", "Clients, contracts and the invoice you are afraid to send. Talk about rates, scope that grew on its own, and the polite email that took three drafts. Nobody here will tell you to lower your price to keep the peace."),
    ("Algeria Tech Scene", "Meetups, hiring, and what is actually happening locally. Post events in Algiers, Oran, Constantine and the smaller cities too. If your company is hiring, include the stack and whether remote is possible from here."),
    ("Study Group", "Weekly check ins for people working through the courses together. Say what you finished, what blocked you and what you plan for next week. Short updates are fine. Silence for a month is also fine, come back when you can."),
    ("Front End Help", "React, CSS and the bug you have been staring at for two hours. Paste the code, the error and what you already tried. Someone usually spots it in a minute, and it is rarely the thing you suspected first."),
    ("Data Corner", "Pandas, SQL and charts that do not lie. Share a query you are proud of, ask why a number looks wrong, or post a chart and let people pick it apart. Sample data is welcome, screenshots of tables are not."),
    ("Product Photography", "Lighting setups, edits and honest feedback on product shots. Post the raw frame next to the final edit so we can see what changed. Phone photos are welcome here, the camera matters less than the light."),
    ("Motion Reel", "Animation work in progress and the easing curves you argue about. Share the clip, the duration and what it is for. If something feels off, say so in the post, it saves everyone a round of polite guessing."),
    ("Accessibility Crew", "Audits, fixes and the small changes that make a product usable for everyone. Post what you tested, how you tested it and what still fails. Keyboard, contrast, focus order and labels are good places to start."),
    ("Copy Talk", "Interface text, tone and the button label you rewrote six times. Share the before and after and why you changed it. Short questions get good answers here, long rants get better ones."),
    ("Job Board", "Openings from people in this community. Include the salary range or it gets removed. Say whether it is remote, hybrid or in the office, and name the city. Recruiters are welcome as long as they follow the same rules."),
    ("Course Feedback", "What is confusing, what is too fast, what should be added. Mention the lesson number and the minute if you can. Complaints with a timestamp get fixed, general complaints get read once and forgotten."),
    ("Off Topic", "Anything that does not fit above. Keep it friendly. Bad jokes, good books, the keyboard you regret buying and the coffee place with working wifi all belong here, as long as nobody is selling anything."),
    ("Announcements", "Official updates about courses, live sessions and the platform. Only moderators post here, so turn on notifications if you do not want to miss a date change. Questions about an announcement go in the thread below it."),
    ("Mentors Room", "Draft community for the mentoring pilot. We are still deciding how pairing works, so use this space to say what you would want from a mentor and how much time you can realistically give as one."),
    ("Beta Testers", "Draft community for people testing new features before release. Report what broke, what confused you and what felt slow. Include your browser and device, it saves us a round of questions."),
]

COMMUNITY_NICHES = {
    "Backend Engineering with Python": "coding",
    "Show Your Work": "coding",
    "Career Talk": "business and career",
    "Freelance Lounge": "business and career",
    "Algeria Tech Scene": "coding",
    "Study Group": "coding",
    "Front End Help": "coding",
    "Data Corner": "coding",
    "Product Photography": "photography",
    "Motion Reel": "video",
    "Accessibility Crew": "design",
    "Copy Talk": "writing",
    "Job Board": "business and career",
    "Course Feedback": "design",
    "Off Topic": "design",
    "Announcements": "design",
    "Mentors Room": "business and career",
    "Beta Testers": "coding",
}

PODCASTS = [
    ("The Pixel Hour", "One guest, one project, one hour. We talk about the decisions behind the screens, not the screenshots. Expect long pauses, interruptions and at least one story about a deadline that moved twice.", "Yacine Benali"),
    ("Designers Who Ship", "Short episodes about finishing things. Guests bring a project they actually released, including the parts that are still rough. No portfolio talk, no perfect case studies, just finished work and what it cost.", "Meriem Haddad"),
    ("Two Developers Arguing", "Two friends with different opinions on architecture. Usually one of them is wrong. Each episode starts with a real decision and ends with one of them changing their mind, or pretending to.", "Anis Khelifi"),
    ("The Freelance Files", "Client stories, some good, some painful, all useful. Rates, scope, late payments and the message you should have sent a week earlier. Names are changed, the numbers are not.", "Sabrina Mansouri"),
    ("Data Without Drama", "Plain talk about numbers, dashboards and the questions behind them. We open a real dataset, argue about the chart and end with something you could actually send to a manager.", "Wassim Saidi"),
    ("Screens and Coffee", "Twenty minute chats about whatever interface annoyed us this week. No preparation, no guests, just two people describing a form that should have been simpler.", "Lina Belkacem"),
    ("Studio Visits", "Recorded inside small studios. Desks, tools, and how the work gets made. We ask about rent, equipment and the boring systems that keep a two person studio running.", "Sofiane Cherif"),
    ("Learn in Public", "People sharing what they are learning right now, mistakes included. Guests are not experts yet, and that is the point. You hear the confusion before the tidy explanation.", "Nour Ait Ali"),
    ("The Product Lens", "Product managers and designers talking about the same decision from two sides. One episode, one feature, two versions of why it shipped the way it did.", "Rania Bensalem"),
    ("Type Talk", "Fonts, spacing and the details nobody notices until they are wrong. We look at real screens and explain what the type is doing, and how a small change fixes it.", "Hakim Lounis"),
    ("Motion Sickness", "Animation critique and the transition everyone overuses. We watch a clip, slow it down and argue about easing. Sometimes the answer is to delete the animation entirely.", "Imene Meziane"),
    ("Behind the Build", "How a feature goes from sketch to production. Developers and designers walk through one ticket, including the estimates that were wrong and the meeting that should have been a message.", "Karim Rahmani"),
    ("Career Switch", "People who changed fields after thirty. How they did it and what it cost. Honest numbers about salary drops, study hours and the family conversation before the first course.", "Nesrine Zerrouki"),
    ("Notes from Class", "Short recordings from live sessions and the questions that came up. No editing, so you hear the tangents and the moments where the room goes quiet and someone asks the useful question.", "Bilal Ferhat"),
    ("The Weekly Standup", "Five minutes on what happened on the platform this week. New courses, fixed bugs and one thing we learned from a support message. Recorded on Friday, published before lunch.", "Sonia Guerrouj"),
    ("Field Recordings", "Interviews from meetups, noisy rooms and all. Bad audio, good conversations. We bring one microphone and ask people what they are working on right now.", "Adel Benyoucef"),
    ("Season Two Trailer", "Draft feed for the next season. Two minutes of clips and a rough idea of the schedule, kept here while the episodes are still being edited and the names are not final.", "Yacine Benali"),
    ("Test Feed", "Draft feed used while setting up the studio. Short clips, wrong levels and one recording of a door closing. Ignore this one unless you are curious about the process.", "Meriem Haddad"),
]

FLAGSHIP_EPISODES = [
    (
        "Why we draw before we design",
        "A short argument for paper, and the story of a project that went wrong because we skipped it.\n\n"
        "In this episode we explore why sketching on paper remains one of the most underrated tools in a designer's workflow. "
        "Our guest walks us through a real project where skipping the paper phase led to three weeks of unnecessary revisions, "
        "and how going back to basics saved the entire timeline.\n\n"
        "We also discuss the cognitive science behind why handwriting triggers different problem-solving pathways than digital tools, "
        "and practical tips for integrating quick sketching into teams that have never tried it.",
    ),
    (
        "The 8 point grid, honestly",
        "Where the rule comes from, when it helps, and the two cases where it gets in the way.\n\n"
        "The 8 point grid system has become a staple in modern UI design, but like any tool it has its limitations. "
        "We sit down with a designer who has applied it across dozens of projects to hear what actually works and what doesn't.\n\n"
        "From spacing systems to typography alignment, we cover the practical implementation details that are rarely discussed in tutorials. "
        "Plus, the two specific scenarios where our guest recommends ignoring the grid entirely and trusting your eye instead.",
    ),
    (
        "Critiquing a pricing page live",
        "We open a real page, find eleven problems and fix six of them in forty minutes.\n\n"
        "There is nothing quite like a live critique to expose how much we miss when we design in isolation. "
        "In this episode we pick a real pricing page from a well-known SaaS product and walk through it section by section.\n\n"
        "By the end of the session we have identified eleven usability issues, six of which we redesign on the fly. "
        "The conversation covers hierarchy, pricing psychology, mobile responsiveness, and why most pricing tables confuse rather than convince.",
    ),
    (
        "Naming components with a stranger",
        "A recorded exercise where two people name the same component library without talking first.\n\n"
        "Naming is one of the hardest problems in design systems, and this episode proves it experimentally. "
        "Two designers are given the same set of components and asked to name them independently, with no communication allowed.\n\n"
        "The results are surprising, sometimes hilarious, and deeply revealing about how different people interpret the same visual elements. "
        "We discuss what this means for team collaboration and how to build naming conventions that actually stick.",
    ),
    (
        "What clients actually see",
        "We show a design to five people who do not work in tech and record their first reactions.\n\n"
        "It is easy to forget that most people do not see interfaces the way designers do. "
        "In this experiment we take a polished design and show it to five non-technical users, recording their unfiltered first reactions.\n\n"
        "The gap between what we intended and what they perceived is both humbling and educational. "
        "We break down each reaction, discuss what it reveals about our assumptions, and share practical ways to close this gap in your own work.",
    ),
    (
        "The case study problem",
        "Why portfolios full of screenshots fail, and what to write instead.\n\n"
        "A portfolio case study should tell a story, not just display screenshots. Yet the vast majority of design portfolios fall into the same trap: "
        "beautiful images with almost no context about the problem, the process, or the outcome.\n\n"
        "In this episode we dissect what makes a case study memorable. We look at real examples, both good and bad, "
        "and outline a simple structure that turns any project into a compelling narrative. "
        "If you are updating your portfolio, this episode might save you hours of work.",
    ),
    (
        "On hiring juniors",
        "A hiring manager explains what makes a junior portfolio stand out in a stack of sixty.\n\n"
        "Breaking into the industry is harder than ever, but the portfolios that get noticed share specific qualities. "
        "A hiring manager with over a decade of experience joins us to explain exactly what they look for when reviewing junior applicants.\n\n"
        "We cover the difference between showing process and showing personality, why side projects often matter more than coursework, "
        "and the one thing that almost every rejected portfolio is missing. "
        "If you are early in your career, this episode is worth taking notes.",
    ),
    (
        "Arabic and Latin in one layout",
        "Two designers walk through a bilingual interface and the alignment issues that follow.\n\n"
        "Designing for bilingual interfaces that mix Arabic and Latin scripts presents unique challenges that most Western designers never encounter. "
        "From baseline alignment to line height inconsistencies, the devil is in the details.\n\n"
        "Two designers with experience in bilingual product design walk through a real interface and point out every alignment issue. "
        "They share practical solutions and discuss why RTL support is more than just flipping the layout horizontally. "
        "Essential listening for anyone working on multilingual products.",
    ),
    (
        "Figma variables, slowly",
        "An hour on variables without the hype. Includes the parts that break.\n\n"
        "Figma variables were announced with a lot of excitement, but the reality of using them in production is more nuanced. "
        "We spend an hour going through variables methodically, without the usual hype.\n\n"
        "Our guest has been using variables daily since the beta and shares honest feedback about what works, what breaks, "
        "and where the feature still falls short. We cover modes, typography tokens, colour management, and the edge cases that can trip up even experienced users.",
    ),
    (
        "When to stop designing",
        "A conversation about diminishing returns and shipping something slightly ugly.\n\n"
        "Knowing when to stop designing is one of the most underrated skills in the industry. "
        "In this episode we talk about diminishing returns, perfectionism, and the courage to ship something that is slightly ugly.\n\n"
        "Our guest shares a framework for deciding when a design is good enough, based on years of shipping products under tight deadlines. "
        "We discuss the difference between polish that matters and polish that nobody will ever notice, "
        "and why the best designers are often the ones who know when to walk away.",
    ),
    (
        "Dark mode is not a filter",
        "Colour, contrast and the shortcuts that make dark themes look cheap.\n\n"
        "Dark mode has become an expected feature, but most implementations rely on shortcuts that make the result look cheap. "
        "Inverting colours, using pure black backgrounds, and ignoring contrast ratios are common mistakes.\n\n"
        "We sit down with a designer who specialises in colour systems to understand what actually makes a dark theme feel premium. "
        "Topics include colour palette construction, contrast hierarchies, semantic colour tokens, "
        "and why the best dark modes are designed from the ground up rather than converted from light mode.",
    ),
    (
        "The feedback we ignore",
        "Why useful critique often sounds boring, and the exciting feedback that wastes a week.\n\n"
        "Not all feedback is created equal. Some of the most valuable critique sounds boring at first, "
        "while exciting feedback can send you down a rabbit hole that wastes a week.\n\n"
        "In this episode we explore the psychology of design feedback, why we gravitate toward certain types of critique, "
        "and how to train yourself to recognise the feedback that actually improves your work. "
        "Our guest shares a simple filtering system for deciding which feedback to act on and which to thank politely and ignore.",
    ),
    (
        "Working with developers who care",
        "A developer and a designer replay a handoff that went well and explain why.\n\n"
        "Good handoffs are rare, but when they work the results are magic. In this episode a designer and a developer "
        "replay a real handoff that went exceptionally well and break down exactly why it succeeded.\n\n"
        "They discuss the preparation, the communication, and the tools that made the difference. "
        "Topics include component documentation, spacing specifications, interaction prototypes, "
        "and the single most important question to ask before any handoff meeting.",
    ),
    (
        "Season one questions",
        "Listener questions, including the ones about money.\n\n"
        "For the season finale we open the floor to listener questions. Topics range from pricing and negotiations "
        "to career advice and the future of design tools.\n\n"
        "We answer the questions we were asked honestly, including the uncomfortable ones about money. "
        "How much should a junior designer charge? When is it time to leave a job? What skills matter most in 2026? "
        "No fluff, just real answers from people who have been through it.",
    ),
]

DISCUSSION_POSTS = [
    ("Migrating without breaking prod", "Dropped a column last week and forgot the old code was still deployed for ten minutes. Nothing broke but I aged a year. How do you sequence these things?", "question"),
    ("my first api is live", "three endpoints, one database, and it has been up for four days without me touching it. small thing but I am genuinely proud.", "showcase"),
    ("Do you commit the migration files", "Half the team generates them on the server. That cannot be right, can it?", "question"),
    ("401 vs 403 and when to care", "I keep mixing them up in tests. Anyone have a rule that actually sticks?", "question"),
    ("Stop returning 200 with an error inside", "That is it. That is the post. The client cannot tell success from failure and now everyone writes extra code around it.", "general"),
    ("free tools that actually help backend work", "Drop yours. I will start: a local postgres client and a four line compose file saved me a whole evening.", "general"),
    ("Anyone else find week 3 harder than week 5", "I flew through auth and then lost three days on migrations. Feels backwards.", "question"),
    ("finally finished the final project", "Six weeks. Two rewrites. The part I am proudest of is that the tests still pass after I refactored everything.", "showcase"),
    ("Client wants the field renamed", "It is in three tables and two reports. How do you push back without sounding lazy?", "question"),
    ("Postgres client that works offline", "Found one that runs locally and does not need a server. Useful when the connection dies, which happens a lot here.", "idea"),
    ("my repository got me two interviews", "Sharing the structure in case it helps. One project, a clear readme, tests that run with one command, no screenshots of code.", "showcase"),
    ("Does anyone actually write tests first", "I write them after and then pretend otherwise. Wondering if I am the only one.", "question"),
    ("Small win: I deleted half my models", "Turns out four of them were the same table with different names. The project feels lighter.", "general"),
    ("Checklist before deploying", "Things I run every time now. Migrations, environment variables, a backup, one smoke test. Anything missing?", "idea"),
    ("The error message nobody wrote", "When validation fails we return the raw exception. It looks broken and it leaks table names. Anyone solved this cleanly?", "question"),
    ("Unpopular opinion: fewer dependencies", "One library per problem. That is enough. I said what I said.", "general"),
    ("How long should a readme be", "Mine is getting long and I am worried nobody reads past the setup section.", "question"),
    ("Recorded my first code review", "Nervous the whole time. The feedback was kinder than I expected and much more specific.", "showcase"),
    ("Anyone in Oran meeting up", "Two of us are working through the course. Coffee this weekend if there are more.", "general"),
    ("Naming things is the whole job", "Spent forty minutes on a function name today. No regrets.", "general"),
    ("Adding auth broke my tests", "Every test now needs a token and I copied the same three lines sixty times. How do you keep that tidy?", "question"),
    ("The health check is part of the service", "A service that cannot say it is alive feels broken. One route, four lines, saves an hour at 3 am.", "idea"),
    ("Got my first rejection email", "Turns out they wanted three years of experience for a junior role. Back to the repository.", "general"),
    ("How do you handle breaking changes", "Client wants a different payload shape. Do you version the route or just change it and tell people?", "question"),
    ("week 4 repository is a mess and I love it", "Refactoring it was the most useful hour of the course so far.", "general"),
    ("Sharing my debugging checklist", "Eight questions I run through before asking for help. Take what is useful.", "idea"),
    ("Handling Arabic text in the database", "Working on a bilingual form. Any traps with sorting or search?", "question"),
    ("Finally understand migrations", "The moment it clicked was when I stopped editing the database by hand and let the tool do it.", "general"),
    ("Is docker overkill for a small project", "One student project, one server. Do we need containers or is that borrowing trouble?", "question"),
    ("My client asked for an admin login without passwords", "I said no. They accepted. I am as surprised as you are.", "general"),
    ("Code review thread", "Post one repository, review the person above you. Specific notes only, no empty praise.", "announcement"),
    ("The best feedback I got this month", "It was one sentence: this function does four things and the name only mentions one.", "general"),
    ("Anyone running background jobs in production", "Curious whether small teams actually run a queue or just do it inside the request and hope.", "question"),
    ("Screenshot of my first schema", "It is bad. That is the point. Nine months later I can see exactly why.", "showcase"),
    ("Mobile first is not a rule", "Sometimes the client is another service and the shape of the response matters more than the screens. Fight me politely.", "general"),
    ("What do you charge for a small api", "Three endpoints, one database, one week of work. Trying to price fairly without underselling.", "question"),
    ("Audio tip for the lessons", "Play them at 1.25 speed. I rewatched week 3 in half the time and remembered more.", "idea"),
    ("I deleted half my environment variables", "Three of them were the same password with different names. The deploy feels calmer.", "general"),
    ("How to ask for a testimonial", "Client loved the work. I do not know how to ask for words without it feeling awkward.", "question"),
    ("Small team, big client", "We won a contract against a much larger company. Happy to answer questions about the pitch.", "showcase"),
    ("Pagination for small datasets", "Do you paginate from the start or wait until the table gets big?", "question"),
    ("Reminder to test your endpoint with a bad token", "Mine returned the data anyway. Two minutes to fix, would have shipped open.", "general"),
    ("The course changed how I read error logs", "I cannot use an app without noticing the stack traces now. Slightly annoying, mostly useful.", "general"),
    ("Anyone else keep a broken queries folder", "Mine has forty files. Best learning tool I have.", "idea"),
    ("Client communication template", "Mine is four lines. What broke, what I need, when I need it, what happens next. Feel free to steal.", "idea"),
    ("Are diagrams still useful", "Or do we all just start coding now and pretend we planned it?", "question"),
    ("Progress after five weeks", "Enrolled in three courses, finished one, started two. Slower than I planned and still fine.", "general"),
    ("Found a bug in the lesson repository", "The test fixtures point at the old database name. Anyone else seeing this?", "question"),
    ("I hate huge response objects", "Returning every column because it is easier is how you get a slow app and a confused client.", "general"),
    ("Sharing my weekly review routine", "Fifteen minutes on Friday, three questions. Keeps me from starting over every Monday.", "idea"),
    ("First time presenting to a client", "Any tips for the moment they go quiet and stare at the screen?", "question"),
    ("Before and after, same project", "Two years apart. The newer one is less clever and much easier to maintain.", "showcase"),
    ("How do you keep the repository small", "Mine crosses two hundred megabytes and cloning starts to take forever.", "question"),
    ("The 20 minute rule", "If I am stuck for 20 minutes I ask someone. Saves me three hours a week.", "idea"),
    ("Anyone using a second monitor", "Wondering if it actually helps or if I just want to buy something.", "general"),
    ("Client data is in Arabic and I do not speak it well", "How do you check sorting and search without guessing?", "question"),
    ("Reminder: write the error responses before the happy path", "It changed the whole design for the better.", "idea"),
    ("My deploy script is finally four lines", "Three weeks of fighting. Nobody tells you most of the work is deleting things.", "showcase"),
    ("Do you keep notes in the repository", "Or a separate doc? I forget where I wrote things.", "question"),
    ("A small thank you to whoever answers questions here", "You know who you are. This community carried me through week 3.", "general"),
]

DISCUSSION_REPLIES = [
    "same thing happened to me last week. check the foreign key order too, mine was off and the migration ran twice.",
    "honestly it looks fine to me. maybe return the created resource instead of an empty body.",
    "I draw the line when a new developer can run it from the readme without asking me anything.",
    "try the bad token test first. remove the header and see what comes back.",
    "this is the post I needed on a Monday.",
    "send the repository, I will look at it tonight.",
    "I charge a flat number for three endpoints and stop counting hours. Clients like it and so do I.",
    "one dependency per problem is right. two if you have a really good reason and a written apology.",
    "the versioned route reads better on a large team but the changelog is the real test.",
    "not overkill. start with the compose file and a health check, skip orchestration until you have two services.",
    "I had the same problem with sorting. The fix was the collation, not the query.",
    "that login flow is the reason I started learning this stuff.",
    "agreed on validation. one schema at the edge is worth more than checks in every function.",
    "which project? genuinely want to see it.",
    "I keep a broken queries folder too. It is the only honest record of progress.",
    "the part about what you got wrong is the part people read. keep it.",
    "tests are a tool not a religion. I skip them for throwaway scripts and regret it later.",
    "twenty minutes is generous. I give myself ten before asking, and I still wait too long.",
    "have you tried it on a cheap server? that is where most of my timeouts show up.",
    "your contract should say two rounds of changes. it is okay to say it out loud on a call.",
    "the fourth revision is usually a different project. charge for it.",
    "I would avoid a second monitor until the single one feels too small.",
    "keep the paragraph about the mistake. it is the strongest part.",
    "auth first, then pagination. the rest can wait.",
    "one repository per person as the post says. I will start tonight.",
    "diagrams are useful when you disagree about the data, not about the code.",
    "the function names in my project are all do thing final final two. I feel seen.",
    "for the bilingual data use a real collation and test names that start with the same letter. it worked for us.",
    "logs are the reason I stopped returning raw exceptions. try a short message and an id.",
    "you are not alone. week 3 is the whole course.",
    "post the endpoint. I will tell you what I see first, then what I think.",
    "caching everything is a way to hide the map.",
    "this is a good reminder. my own test suite fails at the second fixture.",
    "keep the weekly review. mine is a sticky note and it still works.",
    "the quiet moment is normal. ask them what they were expecting to see.",
    "migrations clicked for me when I stopped editing the database by hand.",
    "clear due dates reduced my late payments more than any polite email.",
    "the indexes on that table are missing, worth fixing before launch.",
    "I would ship it. you can always adjust after real users complain.",
    "thanks for writing this up. saving it for the next project.",
]

GROUPS = [
    ("Cohort One", "People who started in January and are working through the backend course together."),
    ("Cohort Two", "The February group. Same course, different pace."),
    ("Front End Team", "Everyone taking the React and FastAPI courses this quarter."),
    ("Studio Members", "Small studio owners and freelancers who meet on Thursdays."),
    ("Mentors", "People who volunteered to review portfolios once a month."),
    ("Beta Testers", "Members who try new features before everyone else and complain usefully."),
]

FOLDERS = [
    ("Course artwork", "Covers and banners used across the catalogue.", True),
    ("Live session recordings", "Raw recordings, before editing.", False),
    ("Brand assets", "Logos, colours and the font files.", False),
    ("Community photos", "Pictures from meetups and studio visits.", True),
    ("Podcast covers", "Artwork for every show.", True),
    ("Reference screenshots", "Screens we look at during critiques.", False),
]

MEDIA_NAMES = [
    "Cover draft 03", "Banner wide final", "Studio desk", "Meetup Oran 12",
    "Meetup Algiers 08", "Podcast cover blue", "Podcast cover grey", "Type specimen",
    "Wireframe scan 01", "Wireframe scan 02", "Colour test warm", "Colour test cool",
    "Critique board", "Class photo", "Whiteboard notes", "Pricing page before",
    "Pricing page after", "Booking form", "Dashboard dark", "Dashboard light",
    "Icon set v1", "Icon set v2", "Motion test 01", "Motion test 02",
    "Photo setup", "Product shot 01", "Product shot 02", "Reel cover",
    "Podcast episode 12 cover", "Podcast episode 13 cover", "Interview still",
    "Two camera setup", "Audio check", "Font pairing sheet", "Spacing cheat sheet",
    "Accessibility notes", "Form labels", "Empty state sketches", "Old portfolio",
    "New portfolio",
]

ASSIGNMENTS = [
    ("Build a booking endpoint", "Pick a local service that takes bookings by phone and build the endpoint they would need. One create route, validation and one clear error response.", "NUMERIC"),
    ("Add a database migration", "Create a table for bookings with the fields you actually need, write the migration, then run it twice to prove it is safe.", "NUMERIC"),
    ("Write the first test", "Pick one endpoint and write a test that fails when the validation is removed. Include a fixture for the test database.", "NUMERIC"),
    ("Protect an endpoint", "Add a token check and one role check to an existing route. Write down what happens when the token is missing and when it is expired.", "PASS_FAIL"),
]

MEDIA_TAGS = [
    "figma", "demo", "practice", "critique", "podcast", "community", "photography",
]

COURSE_TRANSLATIONS = {
    "Backend Engineering with Python": {
        "fr": {
            "name": "Developpement backend avec Python",
            "description": "Six semaines pour construire une API depuis un dossier vide jusqu a un service qui tourne sur un serveur. On commence par git et une structure de projet propre, puis on avance sur les requetes, une vraie base de donnees, l authentification, les tests et le deploiement. Vous finissez avec un service que vous pouvez montrer et expliquer. Apportez un ordinateur portable avec Python installe.",
            "about": "Ce cours existe parce que je n ai cesse de rencontrer des gens qui savaient ecrire du Python mais qui se figeaient des qu un projet devait quitter leur ordinateur. Six semaines, un seul projet, construit en public. Nous commencons avec un dossier vide la premiere semaine et terminons avec un service qui tourne sur un serveur que vous pouvez montrer aux autres. Il n y a pas de module theorique separe. Tout ce que nous couvrons apparait dans le code que vous etes deja en train d ecrire, c est pourquoi les lecons sont courtes et le projet ne l est pas.\n\nChaque semaine suit le meme rythme : une lecon a regarder, un exercice sur le projet, puis une revision. J enregistre le lundi, vous envoyez l exercice jeudi, et je lis chaque pull request le vendredi. Cette revision est ce que les gens disent avoir change leur facon de travailler, parce que je finis par commenter les trois memes choses que la plupart d entre vous font mal la premiere fois : la gestion des erreurs, le nommage, et la forme d une fonction. Ce n est pas un systeme de notation. C est un second regard pendant que le code est encore assez petit pour etre corrige en un apres-midi.\n\nApportez les bases de Python : les fonctions, les listes, les dictionnaires, et la volonte de lire un message d erreur a voix haute. Vous n avez pas besoin d experience en backend, de connaissances sur Docker ou d un compte cloud. La troisieme semaine est celle ou la plupart des gens ralentissent, parce que les bases de donnees punissent les suppositions, et je prefere vous le dire maintenant plutot que de pretendre que tout est facile. Si vous avez deja mis en ligne quelque chose de petit sans etre tout a fait sur de pourquoi ca a marche, vous etes exactement la personne a qui ce cours s adresse.\n\nNous utilisons FastAPI, Postgres, SQLModel et pytest, avec git des le premier commit. Aucun de ces choix n est un accident de mode. FastAPI garde les definitions de requete et de reponse a cote de la route, Postgres est ce que vous rencontrerez dans la plupart des emplois dans le secteur, et pytest vous donne un test qui echoue que vous pouvez reellement lire. Si votre equipe utilise autre chose, les idees se transferent. Les outils sont la chose la moins importante que vous retiendrez.\n\nA la fin, vous aurez un depot avec un historique reel, des tests qui detectent les regressions, un README qu un autre developpeur peut suivre, et un deploiement que vous pouvez expliquer sans avoir recours a des gestes vagues. Vous obtiendrez aussi les parties qui n apparaissent jamais dans un programme : comment revoir gentiment le travail de quelqu un d autre, comment poser une question qui obtient vraiment une reponse, et comment savoir si le bug est dans votre code ou dans vos hypotheses. La communaute reste ouverte un mois apres la fin du cours, et les personnes qui terminent ont tendance a continuer a revoir le travail des autres bien apres.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Construire une API depuis un dossier vide jusqu a un deploiement en production\", \"emoji\": \"\\U0001f6e0\"}, {\"id\": \"learning-1\", \"text\": \"Ecrire des migrations qu on peut executer deux fois sans risque, et en annuler une\", \"emoji\": \"\\U0001f5c4\"}, {\"id\": \"learning-2\", \"text\": \"Ajouter l authentification et les controles de roles que vous pouvez expliquer ligne par ligne, afin qu aucun inconnu ne puisse lire les donnees d un autre utilisateur\", \"emoji\": \"\\U0001f510\"}, {\"id\": \"learning-3\", \"text\": \"Tester et deboguer votre propre code avant qu un utilisateur ne trouve un probleme, en utilisant les messages d erreur que vous rencontrerez a la troisieme semaine\", \"emoji\": \"\\U0001f9ea\"}]",
            "tags": "python, backend, api, fastapi, postgres, git",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Python 3.11 ou superieur installe, et la confiance pour executer un fichier depuis le terminal\"}, {\"text\": \"Un editeur de code que vous aimez deja — VS Code, PyCharm ou Neovim, peu importe lequel\"}, {\"text\": \"Environ une heure par jour pendant six semaines, sur un ordinateur ou vous pouvez installer des paquets\"}]",
                "instructor": {"name": "", "title": "Fondateur et developpeur backend", "bio": "Construit des API en Python et Postgres. A casse une base de donnees en production deux fois et en a appris plus que de n importe quel tutoriel."},
                "target_audience": {"for": ["Debutants Python qui ont ecrit quelques scripts et veulent construire de vrais projets backend", "Developpeurs autodidactes cherchant un parcours structure en ingenierie backend", "Personnes en reconversion vers le developpement web avec un peu d experience en code"], "not_for": ["Ingenieurs backend experimentes qui deja deployent des API en production", "Debutants complets en programmation — suivez d abord un cours d introduction a Python"]},
            },
        },
        "ar": {
            "name": "هندسة الواجهة الخلفية ببايثون",
            "description": "ستة اسابيع لبناء واجهة برمجة من مجلد فارغ الى خدمة تعمل على سيرفر. نبدا ب git وتنظيم المشروع ثم ننتقل الى الطلبات وقاعدة بيانات حقيقية والمصادقة والاختبارات والنشر. تنتهي مع خدمة يمكنك عرضها وشرحها. احضر حاسوبا محمولا مثبتا عليه بايثون.",
            "about": "هذه الدورة موجودة لأنني كنت ألتقي دائما بأشخاص يعرفون كتابة بايثون لكنهم يتجمدون بمجرد أن يغادر المشروع أجهزتهم المحمولة. ستة أسابيع، مشروع واحد، نبنيها علنا. نبدأ بمجلد فارغ في الأسبوع الأول وننتهي بخدمة تعمل على سيرفر يمكنك توجيه الآخرين إليه. لا توجد وحدة نظرية منفصلة. كل ما نغطيه يظهر في الكود الذي تكتبه بالفعل، ولهذا الدروس قصيرة والمشروع ليس كذلك.\n\nكل أسبوع يتبع نفس الإيقاع: درس واحد للمشاهدة، تمرين واحد على المشروع، ثم مراجعة. أسجل يوم الاثنين، ترسل التمرين يوم الخميس، وأقرأ كل طلب سحب يوم الجمعة. تلك المراجعة هي الجزء الذي يقول الناس إنه غير طريقة عملهم، لأنني أنتهي بالتعليق على نفس الأشياء الثلاثة التي يخطئ فيها معظمكم في المرة الأولى: معالجة الأخطاء، التسمية، وشكل الدالة. إنه ليس نظام تقييم. إنها عين ثانية بينما الكود لا يزال صغيرا بما يكفي لإصلاحه في ظهر يوم واحد.\n\nاحضر أساسيات بايثون: الدوال، القوائم، القواميس، والاستعداد لقراءة رسالة خطأ بصوت عال. لا تحتاج خبرة في الواجهات الخلفية، أو معرفة ب Docker، أو حساب سحابي. الأسبوع الثالث هو حيث يبطئ معظم الناس، لأن قواعد البيانات تعاقب التخمين، وأفضل أن أخبرك بذلك الآن بدلا من أن أدعي أن كل شيء سهل. إذا كنت قد نشرت شيئا صغيرا ولم تكن متأكدا تماما لماذا نجح، فأنت بالضبط الشخص الذي صممت هذه الدورة من أجله.\n\nنستخدم FastAPI و Postgres و SQLModel و pytest، مع git من أول commit. ليست أي من هذه الاختيارات مجرد صدفة مواكبة للموضة. FastAPI يحفظ تعريفات الطلب والاستجابة بجانب المسار، Postgres هو ما ستقابله في معظم الوظائف هنا، و pytest يعطيك اختبارا فاشلا يمكنك قراءته فعلا. إذا كان فريقك يستخدم شيئا آخر، الأفكار تنتقل. الأدوات هي أقل شيء مهم ستأخذه معك.\n\nفي النهاية سيكون لديك مستودع بسجل حقيقي، واختبارات تكتشف الانتكاسات، و README يستطيع مطور آخر متابعته، ونشر يمكنك شرحه دون تمويه. ستحصل أيضا على الأجزاء التي لا تدخل أبدا في المنهج الدراسي: كيف تراجع عمل شخص آخر بلطف، كيف تطرح سؤالا يحصل على إجابة فعلا، وكيف تعرف ما إذا كان الخطأ في كودك أم في افتراضاتك. يبقى المجتمع مفتوحا لمدة شهر بعد انتهاء الدورة، والأشخاص الذين يكملون يميلون إلى الاستمرار في مراجعة عمل بعضهم البعض بعد ذلك بوقت طويل.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"ابن واجهة برمجة من مجلد فارغ وصولا الى نشر مباشر\", \"emoji\": \"\\U0001f6e0\"}, {\"id\": \"learning-1\", \"text\": \"اكتب ترحيلات آمنة للتشغيل مرتين، وتراجع عن واحدة\", \"emoji\": \"\\U0001f5c4\"}, {\"id\": \"learning-2\", \"text\": \"اضف المصادقة والتحقق من الادوار يمكنك شرحه سطرا بسطر، حتى لا يستطيع غريب قراءة بيانات مستخدم آخر\", \"emoji\": \"\\U0001f510\"}, {\"id\": \"learning-3\", \"text\": \"اختبر ونقح كودك قبل ان يكتشفه المستخدم، باستخدام رسائل الخطأ التي ستقابلها في الاسبوع الثالث\", \"emoji\": \"\\U0001f9ea\"}]",
            "tags": "بايثون, واجهات خلفية, api, fastapi, postgres, git",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Python 3.11 او احدث مثبت، والثقة لتشغيل ملف من الطرفية\"}, {\"text\": \"محرر اكواد تفضله — VS Code او PyCharm او Neovim، لا يهم اي\"}, {\"text\": \"حوالي ساعة يوميا لستة اسابيع، على حاسوب محمول مسموح لك تثبيت حزم عليه\"}]",
                "instructor": {"name": "", "title": "المؤسس ومطور خلفي", "bio": "يبني واجهات برمجة ب Python و Postgres. عطل قاعدة بيانات في الانتاج مرتين وتعلم من ذلك اكثر من اي درس."},
                "target_audience": {"for": ["مبتدئي بايثون كتبوا بعض السكربتات ويريدون بناء مشاريع خلفية حقيقية", "مطورون علموا انفسهم ويبحثون عن مسار منظم في الهندسة الخلفية", "محولون مهنيون يتجهون نحو تطوير الويب ولديهم بعض الخبرة البرمجية"], "not_for": ["مهندسون خلفيون متمرسون ينشرون واجهات برمجة في الانتاج بالفعل", "مبتدئون كاملون في البرمجة — خذ دورة مقدمة في بايثون اولا"]},
            },
        },
    },
    "Figma for Absolute Beginners": {
        "fr": {
            "name": "Figma pour debutants",
            "description": "Une visite lente de l interface pour ceux qui n ont jamais ouvert Figma. Les cadres, les groupes, le layout automatique et les raccourcis qui font la moitie du travail. Rien d autre. C est tout l interet.",
            "about": "J ai fait ce cours pour ma tante qui tient une petite boulangerie et voulait maquetter un site. Il s est transforme en quelque chose d utile pour tout le monde. Pas de theorie, juste l outil et beaucoup de fichiers d entrainement.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Naviguer dans Figma sans chercher les boutons, et savoir quel panneau contient le reglage que vous cherchez\", \"emoji\": \"\\U0001f5b1\"}, {\"id\": \"learning-1\", \"text\": \"Utiliser les cadres et les groupes correctement, pour que redimensionner un element ne casse pas silencieusement le reste de l ecran\", \"emoji\": \"\\U0001f4d0\"}, {\"id\": \"learning-2\", \"text\": \"Comprendre la mise en page automatique a un niveau de base et construire une carte qui grandit avec son contenu au lieu de le combattre\", \"emoji\": \"\\U0001f4cf\"}, {\"id\": \"learning-3\", \"text\": \"Partager un fichier avec quelqu un d autre, laisser un commentaire utile et transmettre un lien d edition sans donner votre compte\", \"emoji\": \"\\U0001f517\"}]",
            "tags": "figma, debutant, bases",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Un compte Figma gratuit et un navigateur qui peut suivre — aucun abonnement payant necessaire a aucun moment\"}, {\"text\": \"Une souris ou un pavé tactile avec lequel vous etes a l'aise, car les raccourcis reposent sur des clics precis\"}]",
                "instructor": {"name": "", "title": "Designer produit", "bio": "Enseigne Figma a des gens qui ne l'ont jamais ouvert. Dessine encore des wireframes sur papier d'abord."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "فيجما للمبتدئين",
            "description": "جولة بطيئة في الواجهة لمن لم يفتح فيجما من قبل. الاطارات والمجموعات والتخطيط التلقائي والاختصارات التي تنجز نصف العمل. لا شيء غير ذلك. هذا هو الهدف كله.",
            "about": "صنعت هذه الدورة لخالتي التي تدير مخبزا صغيرا وأرادت تصميم موقع تجريبي. تحولت الى شيء مفيد للجميع. لا نظريات ولا دراسات حالة، فقط الاداة وملفات تدريب كثيرة.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"تحرك داخل فيجما دون البحث عن الازرار، واعرف اي لوحة تحتوي على الاعداد الذي تبحث عنه\", \"emoji\": \"\\U0001f5b1\"}, {\"id\": \"learning-1\", \"text\": \"استخدم الاطارات والمجموعات بالطريقة الصحيحة، حتى لا يكسر تغيير حجم عنصر واحد بقية الشاشة بصمت\", \"emoji\": \"\\U0001f4d0\"}, {\"id\": \"learning-2\", \"text\": \"افهم التخطيط التلقائي على مستوى اساسي وابن بطاقة تنمو مع محتواها بدلا من ان تعاكسه\", \"emoji\": \"\\U0001f4cf\"}, {\"id\": \"learning-3\", \"text\": \"شارك ملفا مع شخص آخر، اترك تعليقا مفيدا وسلم رابط تحرير دون اعطاء حسابك\", \"emoji\": \"\\U0001f517\"}]",
            "tags": "فيجما, مبتدئين, اساسيات",
            "extra_metadata": {
                "requirements": "[{\"text\": \"حساب فيجما مجاني ومتصفح يستطيع المواكبة — لا حاجة لخطة مدفوعة في اي وقت\"}, {\"text\": \"فارة او لوحة لمس مريحة لك، لان الاختصارات تعتمد على نقر دقيق\"}]",
                "instructor": {"name": "", "title": "مصمم منتجات", "bio": "يعلم فيجما لمن لم يفتحوه من قبل. لا يزال يرسم الاطارات السلكية على الورق اولا."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Typography for Screens": {
        "fr": {
            "name": "Typographie pour ecrans",
            "description": "La typographie represente la majorite de votre interface. On regarde de vrais ecrans, on les casse et on les reconstruit avec deux graisses et une echelle saine.",
            "about": "Comprend une seance sur le texte arabe et francais dans la meme page, dont chaque projet local a besoin et que presque personne ne teste. Vous repartirez avec une petite checklist que vous pourrez appliquer a n importe quel ecran.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Etablir une echelle typographique que vous pouvez defendre en revue, avec des tailles, des graisses et des hauteurs de ligne qui survivent aux ecrans reels\", \"emoji\": \"\\U0001f4cf\"}, {\"id\": \"learning-1\", \"text\": \"Corriger la longueur de ligne et la hauteur de ligne rapidement, en utilisant une courte checklist au lieu de deviner jusqu a ce que ca paraisse juste\", \"emoji\": \"\\U0001f4d6\"}, {\"id\": \"learning-2\", \"text\": \"Associer le texte arabe et latin sans que cela paraisse faux, y compris les chiffres, la ponctuation et l alignement droite-gauche\", \"emoji\": \"\\U0001f30d\"}, {\"id\": \"learning-3\", \"text\": \"Auditer une page reelle en dix minutes et nommer les trois changements qui l amelioreraient le plus\", \"emoji\": \"\\U0001f50d\"}]",
            "tags": "typographie, mise en page, rtl",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Un navigateur moderne et une page que vous avez le droit de reconcevoir, ou une capture d'ecran claire de celle-ci\"}, {\"text\": \"Aucune connaissance en creation de caracteres requise, mais un peu de CSS accelere les exercices\"}]",
                "instructor": {"name": "", "title": "Typographe", "bio": "Compose du texte pour ecrans et imprimes, et a des opinions tranchees sur la hauteur de ligne qu'elle partagera."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "الخطوط من اجل الشاشات",
            "description": "الخط يشكل معظم الواجهة. ننظر في شاشات حقيقية ونعيد بناءها بوزنين وخط متوازن.",
            "about": "تتضمن جلسة عن الجمع بين العربية والفرنسية في نفس الصفحة، وهو ما يحتاجه كل مشروع محلي ولا يختبره احد تقريبا. ستغادر بقائمة صغيرة يمكنك تطبيقها على اي شاشة.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اضبط سلم طباعي يمكنك الدفاع عنه في المراجعة، مع احجام واوزان وارتفاعات سطر تصمد امام الشاشات الحقيقية\", \"emoji\": \"\\U0001f4cf\"}, {\"id\": \"learning-1\", \"text\": \"اصلح طول السطر وارتفاع السطر بسرعة، باستخدام قائمة قصيرة بدلا من التخمين حتى يبدو صحيحا\", \"emoji\": \"\\U0001f4d6\"}, {\"id\": \"learning-2\", \"text\": \"ازن بين النص العربي واللاتيني دون ان يبدو خطا، بما في ذلك الارقام وعلامات الترقيم والمحاذاة من اليمين لليسار\", \"emoji\": \"\\U0001f30d\"}, {\"id\": \"learning-3\", \"text\": \"دقق صفحة حقيقية في عشر دقائق واذكر التغييرات الثلاث التي ستحسنها اكثر\", \"emoji\": \"\\U0001f50d\"}]",
            "tags": "خطوط, تخطيط, rtl",
            "extra_metadata": {
                "requirements": "[{\"text\": \"اي متصفح حديث وصفحة مسموح لك باعادة تصميمها، او لقطة شاشة واضحة لها\"}, {\"text\": \"لا حاجة لخلفية في تصميم الخطوط، لكن القليل من CSS يسرع التمارين\"}]",
                "instructor": {"name": "", "title": "مصمم خطوط", "bio": "يضبط النص للشاشات والطباعة، ولديه اراء قوية حول ارتفاع السطر سيشاركها."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Python for Everyday Automation": {
        "fr": {
            "name": "Python pour automatiser le quotidien",
            "description": "Renommer cent fichiers, extraire des chiffres d un PDF, envoyer un resume hebdomadaire. De petits scripts qui font gagner une heure chaque semaine, pas un projet de machine learning. Vous apportez un dossier que vous en avez assez de toucher a la main, nous le transformons en trois lignes que vous pourrez relancer demain.",
            "about": "Le cours est construit a partir de taches qu on m a vraiment demandees au travail. Chaque lecon se termine par un script que vous pouvez copier et modifier. Pas besoin de diplome en informatique ni de sermon sur les environnements virtuels.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Lire et ecrire des fichiers sans crainte, y compris CSV, JSON et la structure de dossiers que quelqu un d autre a faite\", \"emoji\": \"\\U0001f4c1\"}, {\"id\": \"learning-1\", \"text\": \"Scraper une page poliment, respecter les limites de taux et stocker ce que vous collectez dans un formulaire reutilisable\", \"emoji\": \"\\U0001f578\"}, {\"id\": \"learning-2\", \"text\": \"Automatiser une tache de tableur ennuyeuse et la relancer le mois prochain sans reecrire tout le script\", \"emoji\": \"\\U0001f4ca\"}, {\"id\": \"learning-3\", \"text\": \"Programmer un script sur votre propre machine pour qu il s execute pendant que vous dormez et vous prevene en cas d echec\", \"emoji\": \"\\u23f0\"}]",
            "tags": "python, automatisation, scripting",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Python installe et capable d'executer un seul fichier depuis le terminal, rien de plus avance que cela\"}, {\"text\": \"Un dossier de fichiers que vous aimeriez arreter de renommer a la main, et une tache repetitive que vous detestez vraiment\"}]",
                "instructor": {"name": "", "title": "Professeur d'automatisation", "bio": "Transforme des taches de bureau repetitives en petits scripts et tient un carnet de chaque raccourci appris a la dure."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "بايثون لاتمتة المهام اليومية",
            "description": "اعادة تسمية مئة ملف، استخراج ارقام من ملف، ارسال ملخص اسبوعي. سكربتات صغيرة توفر ساعة من وقتك كل اسبوع، ليس مشروع تعلم آلة. تحضر مجلد ملفات سئمت التعامل معه يدويا، ونحوله الى ثلاثة اسطر يمكنك تشغيلها مرة اخرى غدا.",
            "about": "بنيت الدورة من مهام طلب مني تنفيذها فعلا في العمل. ينتهي كل درس بسكربت يمكنك نسخه وتغييره. لا حاجة لشهادة في علوم الحاسوب ولا لخطبة عن البيئات الافتراضية.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اقرا واكتب ملفات دون خوف، بما في ذلك CSV و JSON وهيكل المجلدات الذي صنعه شخص آخر\", \"emoji\": \"\\U0001f4c1\"}, {\"id\": \"learning-1\", \"text\": \"اسحب بيانات من صفحة ويب بأدب، احترم حدود الطلبات وخزن ما تجمعه بشكل قابل لاعادة الاستخدام\", \"emoji\": \"\\U0001f578\"}, {\"id\": \"learning-2\", \"text\": \"اتمت مهمة جدول بيانات مملة وشغلها مرة اخرى الشهر القادم دون اعادة كتابة السكربت كله\", \"emoji\": \"\\U0001f4ca\"}, {\"id\": \"learning-3\", \"text\": \"جدول سكربت على جهازك ليعمل وانت نائم ويخبرك عندما يفشل شيء\", \"emoji\": \"\\u23f0\"}]",
            "tags": "بايثون, اتمتة, سكربتات",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Python مثبت وقادر على تشغيل ملف واحد من الطرفية، لا شيء اكثر تقدما من ذلك\"}, {\"text\": \"مجلد ملفات تود التوقف عن اعادة تسميتها يدويا، ومهمة متكررة تكرهها حقا\"}]",
                "instructor": {"name": "", "title": "مدرس الاوتوماتة", "bio": "يحول مهام المكتب المتكررة الى سكربتات صغيرة ويحتفظ بدفتر لكل اختصار تعلمه بالطريقة الصعبة."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Freelancing for Designers": {
        "fr": {
            "name": "Travailler en freelance",
            "description": "Les tarifs, les contrats, le perimetre qui s etend et le message genant quand le client ne repond plus.",
            "about": "La plupart du cours parle de methode, pas de design.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Rediger un brief qui vous protege plus tard, avec le perimetre, les revisions et une clause d annulation equitable pour les deux parties\", \"emoji\": \"\\U0001f4dd\"}, {\"id\": \"learning-1\", \"text\": \"Tarifer le travail sans deviner, en utilisant des tarifs journaliers, des tarifs de projet et des retenues qui correspondent a la valeur que vous apportez\", \"emoji\": \"\\U0001f4b0\"}, {\"id\": \"learning-2\", \"text\": \"Gerer l expansion du perimetre sans bruler les ponts, en utilisant un processus de modification de commande que le client a deja signe\", \"emoji\": \"\\U0001f309\"}, {\"id\": \"learning-3\", \"text\": \"Demander des temoignages et des recommandations sans le silence gene, et construire un pipeline qui survit aux mois calmes\", \"emoji\": \"\\U0001f4c8\"}]",
            "tags": "freelance, design, business",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Un peu de travail client derriere vous, meme un petit projet pour lequel vous avez ete paye\"}, {\"text\": \"Un moyen d'envoyer des factures, et le courage de regarder vos propres chiffres honnetement\"}]",
                "instructor": {"name": "", "title": "Designer freelance", "bio": "Travaille en freelance a temps plein et conserve chaque contrat qui s'est bien passe, plus quelques-uns qui ne se sont pas bien passes."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "العمل الحر للمصممين",
            "description": "الاسعار والعقود وتوسع نطاق العمل والرسالة المحرجة عندما يتوقف العميل عن الرد.",
            "about": "معظم الدورة عن الطريقة والتنظيم وليس عن التصميم.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اكتب موجزا يحميك لاحقا، مع النطاق والمراجعات وشرط الالغاء العادل للطرفين\", \"emoji\": \"\\U0001f4dd\"}, {\"id\": \"learning-1\", \"text\": \"سعر العمل دون تخمين، باستخدام اسعار يومية واسعار مشاريع واتعاب تتناسب مع القيمة التي تقدمها\", \"emoji\": \"\\U0001f4b0\"}, {\"id\": \"learning-2\", \"text\": \"تعامل مع توسع النطاق دون حرق الجسور، باستخدام عملية تغيير الامر وقعها العميل بالفعل\", \"emoji\": \"\\U0001f309\"}, {\"id\": \"learning-3\", \"text\": \"اطلب الشهادات والتوصيات دون الصمت المحرج، وابن خط انتاج ينجو من الاشهر البطيئة\", \"emoji\": \"\\U0001f4c8\"}]",
            "tags": "عمل حر, تصميم, اعمال",
            "extra_metadata": {
                "requirements": "[{\"text\": \"بعض العمل مع العملاء خلفك، حتى مشروع صغير واحد دفعت مقابله فعلا\"}, {\"text\": \"طريقة لارسال الفواتير، والشجاعة للنظر الى ارقامك بصدق\"}]",
                "instructor": {"name": "", "title": "مصمم مستقل", "bio": "يعمل حرا بدوام كامل ويحتفظ بكل عقد سار على ما يرام، بالإضافة الى القليل الذي لم يسر."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Design Systems That Survive a Team": {
        "fr": {
            "name": "Systemes de design qui tiennent dans une equipe",
            "description": "La plupart des systemes de design meurent parce que personne ne les maintient. Ce cours couvre les parties ennuyeuses : nommer, versionner, decider, et dire non a une nouvelle variante de bouton. On reconstruit un petit systeme a partir d un desordre.",
            "about": "Ecrit pour la personne qui herite d un fichier Figma avec quarante-deux styles de boutons et aucune documentation. On travaille les tokens, puis les composants, puis le processus qui le maintient en vie apres le lancement. Amenez votre pire fichier.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Transformer un fichier desordonne en un systeme nomme, avec un proprietaire clair, un journal des modifications et un seul endroit ou les decisions vivent\", \"emoji\": \"\\U0001f5c2\"}, {\"id\": \"learning-1\", \"text\": \"Choisir des tokens au lieu de styles infinis, pour qu un changement de couleur se fasse une fois au lieu de dans quarante cadres\", \"emoji\": \"\\U0001f3a8\"}, {\"id\": \"learning-2\", \"text\": \"Documenter les decisions que les gens liront vraiment, dans des notes courtes attachees au composant qu elles expliquent\", \"emoji\": \"\\U0001f4d8\"}, {\"id\": \"learning-3\", \"text\": \"Gerer les demandes de nouvelles variantes sans perdre le controle, en utilisant un processus que toute l equipe a deja approuve\", \"emoji\": \"\\U0001f6e1\"}]",
            "tags": "design systems, tokens, processus",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Aisance avec Figma ou un outil de design similaire, y compris les composants, les variantes et la mise en page automatique\"}, {\"text\": \"Un fichier desordonne que vous avez le droit de corriger, ou la bibliotheque d'exemple fournie avec le cours\"}]",
                "instructor": {"name": "", "title": "Responsable de systemes de design", "bio": "Passe la plupart de ses semaines a nettoyer des bibliotheques de composants que d'autres ont abandonnees."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "انظمة التصميم التي تصمد في فريق",
            "description": "معظم انظمة التصميم تموت لان لا احد يصونها. هذه الدورة تغطي الجوانب المملة: التسمية، ادارة الاصدارات، من يقرر، وكيف ترفض زراً جديداً. نعيد بناء نظام صغير من الفوضى.",
            "about": "كتبت لمن يرث ملف فيجما باربعين نمط زر وبدون اي توثيق. نعمل على الرموز ثم المكونات ثم العملية التي تحفظه حيا بعد الاطلاق. احضر اسوا ملف عندك.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"حول ملفا فوضويا الى نظام مسمى، مع مالك واضح وسجل تغييرات ومكان واحد تعيش فيه القرارات\", \"emoji\": \"\\U0001f5c2\"}, {\"id\": \"learning-1\", \"text\": \"اختر الرموز بدلا من الانماط التي لا تنتهي، بحيث يحدث تغيير اللون مرة واحدة بدلا من في اربعين اطارا\", \"emoji\": \"\\U0001f3a8\"}, {\"id\": \"learning-2\", \"text\": \"وثق القرارات التي سيقرأها الناس فعلا، في ملاحظات قصيرة مرفقة بالمكون الذي تشرحه\", \"emoji\": \"\\U0001f4d8\"}, {\"id\": \"learning-3\", \"text\": \"تعامل مع طلبات المتغيرات الجديدة دون فقدان السيطرة، باستخدام عملية وافقت عليها الفرق بأكملها بالفعل\", \"emoji\": \"\\U0001f6e1\"}]",
            "tags": "انظمة تصميم, رموز, عمليات",
            "extra_metadata": {
                "requirements": "[{\"text\": \"الراحة مع فيجما او اداة تصميم مشابهة، بما في ذلك المكونات والمتغيرات والتخطيط التلقائي\"}, {\"text\": \"ملف فوضوي مسموح لك باصلاحه، او مكتبة النماذج التي نوفرها مع الدورة\"}]",
                "instructor": {"name": "", "title": "قائد انظمة التصميم", "bio": "يقضي معظم اسابيعه في تنظيف مكتبات المكونات التي تركها اخرون."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Motion Design Basics with After Effects": {
        "fr": {
            "name": "Bases du motion design avec After Effects",
            "description": "Quatre week-ends de keyframes, d easing et d une petite video. On anime une icone, une carte et un etat de chargement, puis on exporte le tout pour le web a une taille qui ne tue pas la page.",
            "about": "Ce n est pas un cours de showreel avec des transitions sophistiquees. Il s agit de creer de petites animations qui expliquent ce que fait l interface. Vous avez besoin d After Effects ou d une alternative gratuite, et d un peu de patience.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Animer avec des keyframes sans lutter contre la timeline, et comprendre pourquoi une animation saute ou derive soudainement\", \"emoji\": \"\\U0001f39e\"}, {\"id\": \"learning-1\", \"text\": \"Choisir un easing qui correspond a l interaction au lieu de la courbe par defaut que tout le monde laisse en place\", \"emoji\": \"\\U0001f3af\"}, {\"id\": \"learning-2\", \"text\": \"Exporter des fichiers legers pour le web qui se chargent rapidement sur un telephone avec une connexion lente\", \"emoji\": \"\\U0001f4e6\"}, {\"id\": \"learning-3\", \"text\": \"Monter un reel de trente secondes a partir de votre propre travail, avec un debut, une fin et rien de superflu entre les deux\", \"emoji\": \"\\U0001f3ac\"}]",
            "tags": "motion, after effects, animation",
            "extra_metadata": {
                "requirements": "[{\"text\": \"After Effects ou une alternative gratuite comme Cavalry ou Rive, les concepts s'appliquent a tous\"}, {\"text\": \"Un court extrait ou une icone que vous voulez animer, et la patience de la regarder image par image\"}]",
                "instructor": {"name": "", "title": "Motion designer", "bio": "Anime des interfaces pour des equipes produit. Pense que la plupart des animations devraient etre plus courtes."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "اساسيات تصميم الحركة مع After Effects",
            "description": "اربع عطل نهاية اسبوع من الاطارات المفتاحية والسلاسة وفيديو قصير. نحرك ايقونة وبطاقة وحالة تحميل، ثم نصدر كل شيء للويب بحجم لا يبطئ الصفحة.",
            "about": "هذه ليست دورة عرض انتقالات ذكية. انها عن صنع حركات صغيرة تشرح ما تفعله الواجهة. تحتاج After Effects او بديل مجاني وقليل من الصبر.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"حرك الاطارات المفتاحية دون محاربة الخط الزمني، وافهم لماذا تقفز الحركة فجاة او تنحرف\", \"emoji\": \"\\U0001f39e\"}, {\"id\": \"learning-1\", \"text\": \"اختر تسهيلا يتناسب مع التفاعل بدلا من المنحنى الافتراضي الذي يتركه الجميع في مكانه\", \"emoji\": \"\\U0001f3af\"}, {\"id\": \"learning-2\", \"text\": \"صدر ملفات صغيرة للويب تظل سريعة التحميل على هاتف ذي اتصال بطيء\", \"emoji\": \"\\U0001f4e6\"}, {\"id\": \"learning-3\", \"text\": \"اقطع مقطعا مدته ثلاثون ثانية من عملك الخاص، مع بداية ونهاية ولا حشو بينهما\", \"emoji\": \"\\U0001f3ac\"}]",
            "tags": "حركة, after effects, رسوم متحركة",
            "extra_metadata": {
                "requirements": "[{\"text\": \"After Effects او بديل مجاني مثل Cavalry او Rive، الافكار تنطبق على جميعها\"}, {\"text\": \"مقطع قصير او ايقونة تريد تحريكها، والصبر لمشاهدتها اطارا باطار\"}]",
                "instructor": {"name": "", "title": "مصمم حركة", "bio": "يحرك الواجهات لفرق المنتج. يعتقد ان معظم الرسوم المتحركة يجب ان تكون اقصر."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Front End Foundations with React": {
        "fr": {
            "name": "Fondations du front end avec React",
            "description": "Composants, etat et le peu de CSS dont vous avez reellement besoin. On construit un tableau de bord qui interroge une fausse API et gere les etats de chargement, vide et d erreur sans les ignorer.",
            "about": "Si vous avez termine un tutoriel mais ne pouvez rien construire seul, c est le chainon manquant. On ecrit du vrai code a chaque seance et je revise les pull requests. Vous avez besoin de bases en HTML et d un peu de JavaScript.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Ecrire des composants faciles a supprimer, avec des props qui decrivent l intention au lieu de ce que le parent a transmis\", \"emoji\": \"\\U0001f9e9\"}, {\"id\": \"learning-1\", \"text\": \"Gerer l etat sans recourir a une bibliotheque des le premier jour, et savoir quand une bibliotheque en vaut vraiment la peine\", \"emoji\": \"\\U0001f504\"}, {\"id\": \"learning-2\", \"text\": \"Gerer les vues de chargement, vides et d erreur pour qu un reseau lent ne laisse jamais l ecran vide ou l utilisateur dans le doute\", \"emoji\": \"\\U0001f6a7\"}, {\"id\": \"learning-3\", \"text\": \"Livrer une petite application sur une vraie URL et la deboguer en production quand quelque chose fonctionne en local mais pas la bas\", \"emoji\": \"\\U0001f680\"}]",
            "tags": "react, javascript, frontend",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Les bases de JavaScript, y compris les tableaux, les objets et les fonctions — nous n'enseignons pas le langage a partir de zero\"}, {\"text\": \"Node et npm installes, ainsi qu'un navigateur avec des outils de developpement fonctionnels\"}]",
                "instructor": {"name": "", "title": "Developpeur front end", "bio": "Ecris du React tous les jours et lit encore la documentation avant chaque version."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "اساسيات الواجهات الامامية مع React",
            "description": "المكونات والحالة والقليل من CSS الذي تحتاجه فعلا. نبني لوحة تحكم تسحب من واجهة برمجة وهمية وتتعامل مع حالات التحميل والفراغ والخطا دون تجاهلها.",
            "about": "اذا انهيت درسا تعليميا ولا تستطيع بناء اي شيء بمفردك، فهذه هي الفجوة. نكتب كودا حقيقيا في كل جلسة واراجع طلبات السحب. تحتاج HTML اساسي وقليل من JavaScript.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اكتب مكونات سهلة الحذف، مع خصائص تصف القصد بدلا من ما مرره المكون الاب\", \"emoji\": \"\\U0001f9e9\"}, {\"id\": \"learning-1\", \"text\": \"ادر الحالة دون اللجوء الى مكتبة من اليوم الاول، واعرف متى تستحق المكتبة العناء فعلا\", \"emoji\": \"\\U0001f504\"}, {\"id\": \"learning-2\", \"text\": \"تعامل مع حالات التحميل والفراغ والخطا حتى لا يترك الاتصال البطيء الشاشة فارغة او المستخدم في حيرة\", \"emoji\": \"\\U0001f6a7\"}, {\"id\": \"learning-3\", \"text\": \"شحن تطبيق صغير الى رابط حقيقي واصلحه في الانتاج عندما يعمل شيء محليا ولكن ليس هناك\", \"emoji\": \"\\U0001f680\"}]",
            "tags": "react, جافاسكريبت, واجهات امامية",
            "extra_metadata": {
                "requirements": "[{\"text\": \"اساسيات JavaScript، بما في ذلك المصفوفات والكائنات والدوال — لن نعلم اللغة من الصفر\"}, {\"text\": \"Node و npm مثبتان، ومتصفح يحتوي على ادوات مطور تعمل\"}]",
                "instructor": {"name": "", "title": "مطور واجهات امامية", "bio": "يكتب React كل يوم ولا يزال يقرأ الوثائق قبل كل اصدار."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Data Analysis with Pandas": {
        "fr": {
            "name": "Analyse de donnees avec Pandas",
            "description": "Chargez un CSV desordonne, nettoyez-le, regroupez-le et repondez a une question que votre chef a posee. On utilise un vrai export d une petite boutique avec des lignes en double et trois formats de date.",
            "about": "La plupart des cours utilisent des donnees parfaites. Celui-ci commence avec le bazar que vous recevez un mardi. Vous avez besoin des bases de Python et de la volonte de lire un message d erreur a voix haute.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Inspecter un dataframe avant de lui faire confiance, en verifiant la forme, les types et les lignes qui ont discretement disparu\", \"emoji\": \"\\U0001f50e\"}, {\"id\": \"learning-1\", \"text\": \"Nettoyer les doublons et les dates cassees sans perdre les lignes dont vous avez reellement besoin pour la reponse\", \"emoji\": \"\\U0001f9f9\"}, {\"id\": \"learning-2\", \"text\": \"Grouper et resumer pour une vraie question, puis expliquer le chiffre a quelqu un qui le contestera\", \"emoji\": \"\\U0001f4c8\"}, {\"id\": \"learning-3\", \"text\": \"Sauvegarder un graphique que quelqu un peut lire d un coup d oeil, avec un titre qui dit ce qu il montre et aucune decoration\", \"emoji\": \"\\U0001f4c9\"}]",
            "tags": "pandas, donnees, python",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Les bases de Python et Pandas installe, ou un environnement de notebook ou vous pouvez l'installer rapidement\"}, {\"text\": \"Un tableur que vous utilisez vraiment au travail, ou l'export desordonne que nous fournissons avec les lecons\"}]",
                "instructor": {"name": "", "title": "Analyste de donnees", "bio": "Nettoie les tableurs des autres pour gagner sa vie et note chaque correction."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "تحليل البيانات مع Pandas",
            "description": "حمل ملف CSV فوضوي، نظفه، جمعه، واجب عن سؤال واحد طرحه مديرك. نستخدم تصديرا حقيقيا من متجر صغير بصفوف مكررة وثلاثة تنسيقات للتواريخ.",
            "about": "معظم الدورات تستخدم بيانات مثالية. هذه الدورة تبدأ بالفوضى التي تستقبلك صباح الثلاثاء. تحتاج اساسيات بايثون والاستعداد لقراءة رسالة خطا بصوت عال.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"افحص اطار البيانات قبل الوثوق به، وتأكد من الشكل والانواع والصفوف التي اختفت بهدوء\", \"emoji\": \"\\U0001f50e\"}, {\"id\": \"learning-1\", \"text\": \"نظف المكررات والتواريخ المكسورة دون فقدان الصفوف التي تحتاجها فعلا للاجابة\", \"emoji\": \"\\U0001f9f9\"}, {\"id\": \"learning-2\", \"text\": \"جمع ولخص لاجل سؤال حقيقي، ثم اشرح الرقم لشخص سيعترض عليه\", \"emoji\": \"\\U0001f4c8\"}, {\"id\": \"learning-3\", \"text\": \"احفظ رسما بيانيا يمكن لشخص قراءته بنظرة واحدة، مع عنوان يوضح ما يعرضه ولا زخرفة\", \"emoji\": \"\\U0001f4c9\"}]",
            "tags": "pandas, بيانات, بايثون",
            "extra_metadata": {
                "requirements": "[{\"text\": \"اساسيات بايثون و Pandas مثبتة، او بيئة دفتر يمكنك تثبيتها فيه بسرعة\"}, {\"text\": \"جدول بيانات تستخدمه فعلا في العمل، او التصدير الفوضوي الذي نوفر مع الدروس\"}]",
                "instructor": {"name": "", "title": "محلل بيانات", "bio": "ينظف جداول بيانات الاخرين لكسب عيشه ويدون كل اصلاح."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "SQL That Answers Real Questions": {
        "fr": {
            "name": "SQL qui repond aux vraies questions",
            "description": "Jointures, regroupement et la difference entre une requete qui s execute et une requete qui est correcte. On travaille sur une petite base de donnees de boutique et on repond aux questions que le proprietaire se pose vraiment.",
            "about": "Vous ecrirez une quarantaine de requetes dans ce cours. Certaines seront fausses la premiere fois. C est ca, la lecon. Postgres est utilise partout mais les idees s adaptent.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Joindre des tables sans multiplier les lignes par accident, et reperer une jointure qui semble correcte mais renvoie des nombres faux\", \"emoji\": \"\\U0001f517\"}, {\"id\": \"learning-1\", \"text\": \"Utiliser group by et having pour un vrai reporting, y compris les totaux que les gens demandent le lundi matin\", \"emoji\": \"\\U0001f4ca\"}, {\"id\": \"learning-2\", \"text\": \"Lire un plan d execution de requete a un niveau basique et dire quelle partie de votre requete fait tout le travail\", \"emoji\": \"\\U0001f9ee\"}, {\"id\": \"learning-3\", \"text\": \"Deboguer un nombre faux avant de l envoyer a quiconque, en construisant la requete par petites etapes verifiables\", \"emoji\": \"\\U0001f6a8\"}]",
            "tags": "sql, postgres, donnees",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Acces a une base de donnees SQL — Postgres, MySQL ou SQLite fonctionnent tous avec les concepts abordes\"}, {\"text\": \"Une comprehension de base des tables, lignes et colonnes, meme si vos requetes s'arretent a select etoile\"}]",
                "instructor": {"name": "", "title": "Ingenieur de donnees", "bio": "Ecris du SQL qui s'execute le lundi matin sans reveiller personne."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "SQL الذي يجيب عن اسئلة حقيقية",
            "description": "الضم والتجميع والفرق بين استعلام يعمل واستعلام صحيح. نعمل على قاعدة بيانات متجر صغير ونجيب عن اسئلة يطرحها صاحبه فعلا.",
            "about": "ستكتب حوالي اربعين استعلاما في هذه الدورة. بعضها سيكون خاطئا في المرة الاولى. هذا هو الدرس. نستخدم Postgres طوال الوقت لكن الافكار تنتقل.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اضم الجداول دون مضاعفة الصفوف عن طريق الخطأ، واكتشف ضما يبدو صحيحا لكنه يعيد ارقاما خاطئة\", \"emoji\": \"\\U0001f517\"}, {\"id\": \"learning-1\", \"text\": \"استخدم group by و having للتقارير الحقيقية، بما في ذلك المجاميع التي يطلبها الناس صباح الاثنين\", \"emoji\": \"\\U0001f4ca\"}, {\"id\": \"learning-2\", \"text\": \"اقرأ خطة الاستعلام على مستوى اساسي واخبر اي جزء من استعلامك يقوم بكل العمل\", \"emoji\": \"\\U0001f9ee\"}, {\"id\": \"learning-3\", \"text\": \"اصلح رقما خاطئا قبل ارساله لاحد، ببناء الاستعلام في خطوات صغيرة قابلة للتحقق\", \"emoji\": \"\\U0001f6a8\"}]",
            "tags": "sql, postgres, بيانات",
            "extra_metadata": {
                "requirements": "[{\"text\": \"الوصول الى قاعدة بيانات SQL — Postgres او MySQL او SQLite كلها تعمل مع الافكار هنا\"}, {\"text\": \"فهم اساسي للجداول والصفوف والاعمدة، حتى لو كانت استعلاماتك تتوقف عند select نجم\"}]",
                "instructor": {"name": "", "title": "مهندس بيانات", "bio": "يكتب SQL يعمل صباح الاثنين دون ايقاظ احد."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Mobile Apps with React Native": {
        "fr": {
            "name": "Applications mobiles avec React Native",
            "description": "Une base de code, deux magasins, beaucoup de petits problemes d ecran. On construit un simple suivi d habitudes, on gere le stockage hors ligne et on le fait tourner sur un vrai telephone avant la derniere seance.",
            "about": "Le cours suppose des bases de React. On passe du temps sur les parties que les tutoriels ignorent : les boutons de retour, le chevauchement du clavier et ce qui arrive quand le reseau meurt dans un ascenseur.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Configurer un projet qui se compile sur les deux plateformes sans une semaine de configuration et de supposition de versions\", \"emoji\": \"\\U0001f4f1\"}, {\"id\": \"learning-1\", \"text\": \"Gerer la navigation et les gestes de retour pour que le bouton natif du telephone ne ferme jamais l application sur l utilisateur\", \"emoji\": \"\\U0001f500\"}, {\"id\": \"learning-2\", \"text\": \"Stocker des donnees hors ligne et synchroniser plus tard, y compris quoi faire quand deux appareils modifient le meme enregistrement\", \"emoji\": \"\\U0001f4be\"}, {\"id\": \"learning-3\", \"text\": \"Preparer un build pour les tests sur un appareil reel et le mettre entre les mains de quelqu un d autre le meme jour\", \"emoji\": \"\\U0001f527\"}]",
            "tags": "react native, mobile, hors ligne",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Experience avec React, y compris les hooks, les composants et assez de JavaScript pour lire une trace de pile\"}, {\"text\": \"Un telephone pour tester, ainsi qu'Expo installe et un compte gratuit sur les deux magasins d'applications\"}]",
                "instructor": {"name": "", "title": "Developpeur mobile", "bio": "Livres des applications React Native sur les deux magasins et se plaint des deux processus de revue de maniere egale."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "تطبيقات الموبايل مع React Native",
            "description": "قاعدة كود واحدة ومتجران والكثير من مشاكل الشاشات الصغيرة. نبني متتبع عادات بسيط ونتعامل مع التخزين دون اتصال ونشغله على هاتف حقيقي قبل الجلسة الاخيرة.",
            "about": "الدورة تفترض اساسيات React. نقضي وقتا على الاجزاء التي تتخطاها الدروس التعليمية: ازرار العودة وتداخل لوحة المفاتيح وماذا يحدث عندما يموت الاتصال في المصعد.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اعد مشروعا يبني على كلا المنصتين دون اسبوع من الاعداد وتخمين الاصدارات\", \"emoji\": \"\\U0001f4f1\"}, {\"id\": \"learning-1\", \"text\": \"تعامل مع التنقل وحركات العودة حتى لا يغلق زر الهاتف التطبيق على المستخدم\", \"emoji\": \"\\U0001f500\"}, {\"id\": \"learning-2\", \"text\": \"خزن البيانات دون اتصال وزامن لاحقا، بما في ذلك ماذا تفعل عندما يعدل جهازان نفس السجل\", \"emoji\": \"\\U0001f4be\"}, {\"id\": \"learning-3\", \"text\": \"جهز بناء للاختبار على جهاز حقيقي وضعه في ايدي شخص آخر في نفس اليوم\", \"emoji\": \"\\U0001f527\"}]",
            "tags": "react native, موبايل, دون اتصال",
            "extra_metadata": {
                "requirements": "[{\"text\": \"خبرة مع React، بما في ذلك hooks والمكونات وما يكفي من JavaScript لقراءة تتبع المكدس\"}, {\"text\": \"هاتف للاختبار، بالإضافة الى Expo مثبتة وحساب مجاني على كلا متجري التطبيقات\"}]",
                "instructor": {"name": "", "title": "مطور تطبيقات موبايل", "bio": "ينشر تطبيقات React Native على كلا المتجرين ويشتكي من عملية المراجعة في كليهما بالتساوي."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Backend APIs with FastAPI": {
        "fr": {
            "name": "API backend avec FastAPI",
            "description": "Routes, validation, authentification et une base de donnees qui ne tombe pas en panne. On construit l API derriere une petite application de reservation et on la teste avec de vraies requetes.",
            "about": "Destine aux personnes qui savent ecrire du Python mais n ont jamais deploye un endpoint. On couvre les erreurs que je vois dans les revues de code chaque mois, y compris les miennes.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Concevoir des routes que les gens peuvent deviner, avec des noms, des codes de statut et des erreurs qui ont du sens sans documentation\", \"emoji\": \"\\U0001f3e4\"}, {\"id\": \"learning-1\", \"text\": \"Valider les entrees a la peripherie pour que les mauvaises donnees n atteignent jamais la base de donnees ni la boite de reception d un collegue\", \"emoji\": \"\\u2705\"}, {\"id\": \"learning-2\", \"text\": \"Ajouter l authentification sans inventer votre propre systeme, en utilisant les modeles qui ont deja survecu aux audits\", \"emoji\": \"\\U0001f510\"}, {\"id\": \"learning-3\", \"text\": \"Ecrire des tests qui detectent les regressions, couvrant les endpoints que vos utilisateurs appellent chaque jour\", \"emoji\": \"\\U0001f9ea\"}]",
            "tags": "fastapi, python, backend",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Les bases de Python et un terminal que vous n'avez pas peur d'utiliser, y compris ce qu'est un environnement virtuel\"}, {\"text\": \"Postgres ou un moyen de l'executer — Docker suffit, et nous vous montrons la commande exacte\"}]",
                "instructor": {"name": "", "title": "Developpeur backend", "bio": "Concoit des API que d'autres equipes peuvent integrer sans coup de fil."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "واجهات برمجة خلفية مع FastAPI",
            "description": "المسارات والتحقق والمصادقة وقاعدة بيانات لا تتعطل. نبني واجهة البرمجة خلف تطبيق حجز صغير ونختبرها بطلبات حقيقية.",
            "about": "موجهة لمن يعرفون كتابة بايثون لكنهم لم ينشروا نقطة نهاية من قبل. نغطي الاخطاء التي اراها في مراجعات الكود كل شهر، بما فيها اخطائي.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"صمم مسارات يمكن للناس تخمينها، مع اسماء ورموز حالة واخطاء مفهومة دون توثيق\", \"emoji\": \"\\U0001f3e4\"}, {\"id\": \"learning-1\", \"text\": \"تحقق من المدخلات عند الحافة حتى لا تصل البيانات السيئة الى قاعدة البيانات او صندوق بريد زميل\", \"emoji\": \"\\u2705\"}, {\"id\": \"learning-2\", \"text\": \"اضف المصادقة دون اختراع نظامك الخاص، باستخدام الانماط التي نجت من التدقيقات بالفعل\", \"emoji\": \"\\U0001f510\"}, {\"id\": \"learning-3\", \"text\": \"اكتب اختبارات تكتشف الانتكاسات، تغطي نقاط النهاية التي يستدعيها مستخدمونك كل يوم\", \"emoji\": \"\\U0001f9ea\"}]",
            "tags": "fastapi, بايثون, واجهات خلفية",
            "extra_metadata": {
                "requirements": "[{\"text\": \"اساسيات بايثون وطرفية لا تخاف منها، بما في ذلك ما هي البيئة الافتراضية\"}, {\"text\": \"Postgres او طريقة لتشغيله — Docker جيد، ونريك الامر بالضبط\"}]",
                "instructor": {"name": "", "title": "مطور خلفي", "bio": "يصمم واجهات برمجة تستطيع فرق اخرى دمجها دون اتصال."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Photography for Product Teams": {
        "fr": {
            "name": "Photographie pour equipes produit",
            "description": "Comment photographier un produit sur une table avec une fenetre et une feuille de papier. On couvre la lumiere, les angles et les trois retouches qui rendent une photo utilisable sur une page de boutique.",
            "about": "Pas de studio, pas d objectif couteux. La premiere lecon est tournee avec un telephone pour prouver le propos. Apportez n importe quel objet que vous pouvez porter.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Utiliser la lumiere d une fenetre au lieu d acheter une softbox, et savoir quelle heure de la journee donne l ombre la plus nette\", \"emoji\": \"\\U0001f4a1\"}, {\"id\": \"learning-1\", \"text\": \"Cadrer un produit de maniere coherente dans tout un catalogue, pour que quarante photos semblent avoir ete prises par la meme personne\", \"emoji\": \"\\U0001f4f7\"}, {\"id\": \"learning-2\", \"text\": \"Retoucher une photo sans la rendre fausse, en gardant la texture et la couleur proches de ce que l acheteur recoit\", \"emoji\": \"\\U0001f5bc\"}, {\"id\": \"learning-3\", \"text\": \"Exporter aux tailles adaptees pour le web et les places de marche, avec les bonnes dimensions et le bon poids pour chacun\", \"emoji\": \"\\U0001f4e4\"}]",
            "tags": "photographie, produit, ecommerce",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Un appareil photo ou un telephone recent, plus un produit que vous avez le droit de photographier pendant quelques heures\"}, {\"text\": \"Une table pres d'une fenetre, et une feuille de papier blanc que vous acceptez de decouper\"}]",
                "instructor": {"name": "", "title": "Photographe produit", "bio": "Photographie des produits pour les petites boutiques et apprend aux equipes a le faire elles-memes."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "التصوير الفوتوغرافي لفرق المنتج",
            "description": "كيف تصور منتجا على طاولة بجانب نافذة وورقة واحدة. نغطي الاضاءة والزوايا والتعديلات الثلاث التي تجعل الصورة قابلة للاستخدام في صفحة متجر.",
            "about": "لا استوديو ولا عدسة غالية. الدرس الاول مصور بهاتف لاثبات الفكرة. احضر اي شيء يمكنك حمله.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"استخدم ضوء النافذة بدلا من شراء صندوق ضوئي، واعرف اي ساعة من اليوم تعطي اظل انقى\", \"emoji\": \"\\U0001f4a1\"}, {\"id\": \"learning-1\", \"text\": \"التقط المنتج بشكل متناسق عبر الكتالوج، حتى تبدو اربعون صورة وكأن شخصا واحدا التقطها\", \"emoji\": \"\\U0001f4f7\"}, {\"id\": \"learning-2\", \"text\": \"نظف الصورة دون جعلها مزيفة، محافظا على الملمس واللون قريبين مما يستلمه المشتري\", \"emoji\": \"\\U0001f5bc\"}, {\"id\": \"learning-3\", \"text\": \"صدر باحجام مناسبة للويب والاسواق الالكترونية، بالابعاد والوزن المناسبين لكل منها\", \"emoji\": \"\\U0001f4e4\"}]",
            "tags": "تصوير فوتوغرافي, منتجات, تجارة الكترونية",
            "extra_metadata": {
                "requirements": "[{\"text\": \"كاميرا او هاتف حديث، بالإضافة الى منتج واحد مسموح لك بتصويره لبضع ساعات\"}, {\"text\": \"طاولة قرب نافذة، وورقة بيضاء لا تمانع في قصها\"}]",
                "instructor": {"name": "", "title": "مصور منتجات", "bio": "يصور منتجات للمتاجر الصغيرة ويعلم الفرق كيفية القيام بذلك بانفسهم."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Video Editing in DaVinci Resolve": {
        "fr": {
            "name": "Montage video avec DaVinci Resolve",
            "description": "Transformez un entretien de cinq minutes en quelque chose que les gens regardent jusqu au bout. On travaille le rythme, le nettoyage audio et la couleur simple, puis on exporte pour YouTube et pour un ecran de telephone.",
            "about": "La version gratuite de Resolve suffit pour tout ici. On utilise de vraies images d un petit tournage d entretien, y compris les parties genantes.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Couper pour le rythme au lieu de couper pour couper, et savoir quand le silence fait plus de travail qu une transition\", \"emoji\": \"\\u2702\"}, {\"id\": \"learning-1\", \"text\": \"Corriger un mauvais son sans plugins, en utilisant les trois reglages qui resolvent la plupart des problemes de piece bruyante\", \"emoji\": \"\\U0001f3a7\"}, {\"id\": \"learning-2\", \"text\": \"Equilibrer les couleurs entre deux cameras pour qu un entretien ne change pas de teinte a chaque coupe\", \"emoji\": \"\\U0001f3a8\"}, {\"id\": \"learning-3\", \"text\": \"Reglages d export pour chaque plateforme, dimensionnes pour que le fichier ne paraisse pas mou apres le telechargement\", \"emoji\": \"\\U0001f4e4\"}]",
            "tags": "video, resolve, montage",
            "extra_metadata": {
                "requirements": "[{\"text\": \"DaVinci Resolve installe, la version gratuite suffit pour tout ce qui est dans ce cours\"}, {\"text\": \"Des images que vous avez le droit de monter, ou les extraits d'interview que nous fournissons pour suivre le cours\"}]",
                "instructor": {"name": "", "title": "Monteur video", "bio": "Monte des courts-metrages et des videos produit. Dit que le montage consiste surtout a decider quoi enlever."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "تحرير الفيديو مع DaVinci Resolve",
            "description": "حول مقابلة مدتها خمس دقائق الى شيء يشاهده الناس حتى النهاية. نعمل على الايقاع وتنظيف الصوت والالوان البسيطة، ثم نصدر ليوتيوب ولشاشة الهاتف.",
            "about": "النسخة المجانية من Resolve تكفي لكل شيء هنا. نستخدم لقطات حقيقية من تصوير مقابلة صغيرة، بما في ذلك الاجزاء المحرجة.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اقطع للايقاع بدلا من القطع من اجل القطع، واعرف متى يعمل الصمت اكثر من الانتقال\", \"emoji\": \"\\u2702\"}, {\"id\": \"learning-1\", \"text\": \"اصلح الصوت الرديء دون اضافات، باستخدام ثلاثة عناصر تحكم تحل معظم مشاكل الغرفة المزعجة\", \"emoji\": \"\\U0001f3a7\"}, {\"id\": \"learning-2\", \"text\": \"وازن الالوان بين كاميرتين حتى لا يتغير لون المقابلة كل مرة يقطع فيها\", \"emoji\": \"\\U0001f3a8\"}, {\"id\": \"learning-3\", \"text\": \"اعدادات التصدير لكل منصة، بحجم لا يجعل الملف يبدو ناعما بعد التحميل\", \"emoji\": \"\\U0001f4e4\"}]",
            "tags": "فيديو, resolve, تحرير",
            "extra_metadata": {
                "requirements": "[{\"text\": \"DaVinci Resolve مثبت، النسخة المجانية تكفي لكل شيء في هذه الدورة\"}, {\"text\": \"لقطات مسموح لك بقصها، او مقاطع المقابلة التي نوفرها للمتابعة\"}]",
                "instructor": {"name": "", "title": "محرر فيديو", "bio": "يقص الافلام القصيرة وفيديوهات المنتجات. يقول ان معظم التحرير هو تحديد ما يجب ازالته."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Copywriting for Interfaces": {
        "fr": {
            "name": "Redaction pour interfaces",
            "description": "Boutons, erreurs, etats vides et la phrase qui explique un produit complique. Cours court, beaucoup de reecriture. On travaille sur des ecrans reels, on garde l avant et l apres cote a cote et on termine avec une checklist reutilisable.",
            "about": "On prend de vrais ecrans de produits locaux et on reecrit le texte ensemble. Vous detesterez vos premieres versions a la fin, c est le but.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Ecrire des boutons que les gens comprennent a la premiere lecture, en utilisant des verbes que l utilisateur dirait lui-meme a voix haute\", \"emoji\": \"\\U0001f518\"}, {\"id\": \"learning-1\", \"text\": \"Rendre les messages d erreur utiles au lieu d etre polis, en disant a l utilisateur ce qui s est passe et quoi faire ensuite\", \"emoji\": \"\\u26a0\"}, {\"id\": \"learning-2\", \"text\": \"Remplir un etat vide avec quelque chose d utile, pour qu un nouveau compte ne soit pas une impasse des le premier jour\", \"emoji\": \"\\U0001f4ed\"}, {\"id\": \"learning-3\", \"text\": \"Reduire un paragraphe a une seule phrase sans perdre la partie qui compte vraiment\", \"emoji\": \"\\u2702\"}]",
            "tags": "copywriting, ux writing, contenu",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Rien de plus qu'un navigateur — un compte gratuit sur n'importe quel produit que vous trouvez deroutant est utile\"}, {\"text\": \"Une interface dont le texte vous ennuie, idealement une que vous avez le droit de recrire\"}]",
                "instructor": {"name": "", "title": "UX writer", "bio": "Ecris le texte d'interface pour des produits qui n'ont pas les moyens de derouter quiconque."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "كتابة المحتوى للواجهات",
            "description": "الازرار والاخطاء والحالات الفارغة والجملة التي تشرح منتجا معقدا. دورة قصيرة وكثير من اعادة الكتابة. نعمل على شاشات حقيقية ونحتفظ بما قبل وبعد جنبا الى جنب وننهي بقائمة مراجعة تعيد استخدامها.",
            "about": "ناخذ شاشات حقيقية من منتجات محلية ونعيد كتابة النص معا. ستكره مسوداتك الاولى في النهاية، وهذا هو الهدف.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"اكتب ازرارا يفهمها الناس من اول قراءة، باستخدام افعال قد يقولها المستخدم بصوت عال\", \"emoji\": \"\\U0001f518\"}, {\"id\": \"learning-1\", \"text\": \"اجعل رسائل الخطا مفيدة بدلا من مهذبة، اخبر المستخدم بما حدث وماذا يفعل بعد ذلك\", \"emoji\": \"\\u26a0\"}, {\"id\": \"learning-2\", \"text\": \"املأ الحالة الفارغة بشيء مفيد، حتى لا يكون الحساب الجديد طريقا مسدودا من اليوم الاول\", \"emoji\": \"\\U0001f4ed\"}, {\"id\": \"learning-3\", \"text\": \"اختزل فقرة الى جملة واحدة دون فقدان الجزء المهم فعلا\", \"emoji\": \"\\u2702\"}]",
            "tags": "كتابة اعلانية, كتابة تجربة مستخدم, محتوى",
            "extra_metadata": {
                "requirements": "[{\"text\": \"لا شيء سوى متصفح — حساب مجاني على اي منتج تجده مربكا مفيد\"}, {\"text\": \"واجهة واحدة يزعجك نصها، ويفضل ان تكون مسموحا لك باعادة كتابتها\"}]",
                "instructor": {"name": "", "title": "كاتب تجربة مستخدم", "bio": "يكتب نصوص الواجهات لمنتجات لا تستطيع تحمل ارباك اي شخص."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Accessibility in Practice": {
        "fr": {
            "name": "Accessibilite en pratique",
            "description": "Navigation au clavier, etats de focus, contraste et bases du lecteur d ecran. On audite trois sites locaux et on corrige les pires problemes en direct. Vous repartez avec une courte checklist et les arguments a utiliser quand quelqu un demande pourquoi c est important avant le lancement.",
            "about": "Pas de cours sur la conformite. On utilise un clavier et un lecteur d ecran et on voit ce qui casse. La plupart des correctifs sont petits et peu couteux, c est la partie que personne ne vous dit.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Naviguer dans chaque element interactif avec un clavier seul, et voir exactement ou va le focus\", \"emoji\": \"\\u2328\"}, {\"id\": \"learning-1\", \"text\": \"Corriger les rapports de contraste qui echouent au WCAG, sans donner au design l air d un gilet de haute visibilite\", \"emoji\": \"\\U0001f441\"}, {\"id\": \"learning-2\", \"text\": \"Ajouter des libelles que les lecteurs d ecran peuvent vraiment lire, pas des espaces reserves qui disparaissent des qu on tape\", \"emoji\": \"\\U0001f50a\"}, {\"id\": \"learning-3\", \"text\": \"Ecrire un texte alternatif qui aide au lieu de repeter, decrivant ce que l image montre, pas ce qu elle est\", \"emoji\": \"\\U0001f5bc\"}]",
            "tags": "accessibilite, a11y, design inclusif",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Un navigateur et un site que vous avez le droit de tester, ou les pages d'exemple incluses avec le cours\"}, {\"text\": \"Un clavier et un lecteur d'ecran gratuit comme NVDA ou VoiceOver, les deux suffisent\"}]",
                "instructor": {"name": "", "title": "Specialiste en accessibilite", "bio": "Audite des produits et corrige ce que l'audit trouve. Prefere les petits changements qui sont deployes aux longs rapports."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "امكانية الوصول عمليا",
            "description": "التنقل بلوحة المفاتيح وحالات التركيز والتباين واساسيات قارئ الشاشة. نراجع ثلاثة مواقع محلية ونصلح اسوا المشاكل مباشرة. تغادر بقائمة مراجعة قصيرة والحجج التي تستخدمها عندما يسال احدهم لماذا هذا مهم قبل الاطلاق.",
            "about": "لا محاضرات امتثال. نستخدم لوحة مفاتيح وقارئ شاشة ونرى ما يتعطل. معظم الاصلاحات صغيرة ورخيصة، وهذا الجزء الذي لا يخبرك به احد.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"تصفح كل عنصر تفاعلي بلوحة المفاتيح وحدها، وانظر اين يذهب التركيز بالضبط\", \"emoji\": \"\\u2328\"}, {\"id\": \"learning-1\", \"text\": \"اصلح نسب التباين التي تفشل في WCAG، دون جعل التصميم يبدو كسترة عالية الوضوح\", \"emoji\": \"\\U0001f441\"}, {\"id\": \"learning-2\", \"text\": \"اضف تسميات تستطيع قارئات الشاشة قراءتها فعلا، ليست نصوصا مؤقتة تختفي بمجرد الكتابة\", \"emoji\": \"\\U0001f50a\"}, {\"id\": \"learning-3\", \"text\": \"اكتب نصا بديلا يساعد بدلا من ان يكرر، يصف ما تظهره الصورة، ليس ما هي\", \"emoji\": \"\\U0001f5bc\"}]",
            "tags": "امكانية الوصول, a11y, تصميم شامل",
            "extra_metadata": {
                "requirements": "[{\"text\": \"متصفح وموقع مسموح لك باختباره، او صفحات النماذج المرفقة مع الدورة\"}, {\"text\": \"لوحة مفاتيح وقارئ شاشة مجاني مثل NVDA او VoiceOver، كلاهما كاف\"}]",
                "instructor": {"name": "", "title": "اختصاصي امكانية الوصول", "bio": "يدقق المنتجات ويصلح ما يجده التدقيق. يفضل التغييرات الصغيرة التي تنشر على التقارير الطويلة."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Advanced Figma Prototyping": {
        "fr": {
            "name": "Prototypage avance avec Figma",
            "description": "Variables, logique conditionnelle et prototypes qui se comportent comme le vrai produit. Pour ceux qui connaissent deja les bases et veulent les parties que personne ne documente.",
            "about": "Cours en preparation. Les deux derniers modules sont encore en cours d enregistrement. Les quatre premiers sont prets et je cherche des personnes pour les tester.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Utiliser des variables pour les themes et les etats, afin qu un prototype change de mode sans quarante ecrans en double\", \"emoji\": \"\\U0001F9EA\"}, {\"id\": \"learning-1\", \"text\": \"Construire un prototype avec des conditions reelles, y compris les chemins vides et d erreur que personne ne prend la peine de montrer\", \"emoji\": \"\\U0001F500\"}, {\"id\": \"learning-2\", \"text\": \"Garder un fichier complexe rapide, et savoir quel calque est responsable quand l editeur commence a ralentir\", \"emoji\": \"\\u26A1\"}, {\"id\": \"learning-3\", \"text\": \"Transmettre la logique aux developpeurs clairement, avec des flux annotes au lieu d un appel qui pourrait etre un email\", \"emoji\": \"\\U0001F91D\"}]",
            "tags": "figma, prototypage, variables",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Des competences solides en Figma, y compris les composants, les variantes et la mise en page automatique sans avoir a chercher\"}, {\"text\": \"Un flux que vous voulez prototyper, ou l'un des deux exemples de produits que nous fournissons\"}]",
                "instructor": {"name": "", "title": "Designer produit", "bio": "Cree des prototypes d'interactions avant d'ecrire une ligne de code, ce qui fait gagner un sprint a tout le monde."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "النمذجة المتقدمة مع Figma",
            "description": "المتغيرات والمنطق الشرطي ونماذج تتصرف مثل المنتج الحقيقي. لمن يعرفون الاساسيات ويريدون الاجزاء التي لا يوثقها احد.",
            "about": "دورة قيد الاعداد. اخر وحدتين لا زالتا قيد التسجيل. الاربع الاول جاهزة وابحث عن اشخاص يختبرونها.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"استخدم المتغيرات للمظاهر والحالات، حتى يغير النموذج الاولي وضعه دون اربعين اطارا مكررا\", \"emoji\": \"\\U0001F9EA\"}, {\"id\": \"learning-1\", \"text\": \"ابن نموذجا اوليا بشروط حقيقية، بما في ذلك المسارات الفارغة ومسارات الخطا التي لا يهتم احد باظهارها\", \"emoji\": \"\\U0001F500\"}, {\"id\": \"learning-2\", \"text\": \"حافظ على سرعة ملف معقد، واعرف اي طبقة مسؤولة عندما يبدا المحرر في التباطؤ\", \"emoji\": \"\\u26A1\"}, {\"id\": \"learning-3\", \"text\": \"سلم المنطق للمطورين بوضوح، مع تدفقات مشروحة بدلا من مكالمة يمكن ان تكون بريدا الكترونيا\", \"emoji\": \"\\U0001F91D\"}]",
            "tags": "figma, نمذجة اولية, متغيرات",
            "extra_metadata": {
                "requirements": "[{\"text\": \"مهارات قوية في فيجما، بما في ذلك المكونات والمتغيرات والتخطيط التلقائي دون الحاجة للبحث\"}, {\"text\": \"تدفق تريد نمذجته، او احد منتجين نموذجيين نقدمهما\"}]",
                "instructor": {"name": "", "title": "مصمم منتجات", "bio": "ينمذج التفاعلات قبل كتابة سطر من الكود، مما يوفر سباقا للجميع."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Design Leadership": {
        "fr": {
            "name": "Leadership en design",
            "description": "Pour le designer qui se retrouve soudain avec trois personnes sous sa responsabilite et aucune idee de quoi faire lundi. Recrutement, feedback et proteger l equipe du chaos.",
            "about": "En preparation. Les notes sont en place, les deux premieres lecons sont enregistrees. Celui-ci a besoin de plus d entretiens avant d etre honnete.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Mener un processus de recrutement equitable, avec une grille d evaluation, les memes questions et une decision fondee sur des preuves\", \"emoji\": \"\\U0001F91D\"}, {\"id\": \"learning-1\", \"text\": \"Donner un feedback que les gens peuvent utiliser, d une maniere qui change le travail sans changer leur sentiment a votre egard\", \"emoji\": \"\\U0001F4AC\"}, {\"id\": \"learning-2\", \"text\": \"Dire non aux parties prenantes sans se battre, en utilisant des compromis qu elles peuvent apporter a leur propre responsable\", \"emoji\": \"\\U0001F6E1\"}, {\"id\": \"learning-3\", \"text\": \"Planifier un trimestre qui survit au contact avec la realite, et replanifier sans appeler cela un echec\", \"emoji\": \"\\U0001F4C5\"}]",
            "tags": "leadership, gestion, equipes",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Quelques annees d'experience en equipe, ou une equipe qui est sur le point de se former autour de vous\"}, {\"text\": \"Un probleme que vous evitez actuellement — apportez le vrai, pas un hypothetique\"}]",
                "instructor": {"name": "", "title": "Responsable design", "bio": "Dirige une petite equipe de design et passe plus de temps sur le processus que sur les pixels."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "القيادة في التصميم",
            "description": "للمصمم الذي يجد فجاة ثلاثة اشخاص يتبعونه ولا يعرف ماذا يفعل يوم الاثنين. التوظيف والتغذية الراجعة وحماية الفريق من الفوضى.",
            "about": "قيد الاعداد. الملاحظات جاهزة والدرس الاولين مسجلان. هذه الدورة تحتاج مقابلات اكثر قبل ان تكون صادقة.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"ادر عملية توظيف عادلة، مع بطاقة تقييم، نفس الاسئلة وقرار مبني على الادلة\", \"emoji\": \"\\U0001F91D\"}, {\"id\": \"learning-1\", \"text\": \"قدم تغذية راجعة يستطيع الناس استخدامها، بطريقة تغير العمل دون تغيير شعورهم تجاهك\", \"emoji\": \"\\U0001F4AC\"}, {\"id\": \"learning-2\", \"text\": \"قل لا لاصحاب المصلحة دون معركة، باستخدام مقايضات يمكنهم اخذها الى مديرهم الخاص\", \"emoji\": \"\\U0001F6E1\"}, {\"id\": \"learning-3\", \"text\": \"خطط لربع سنة يصمد عند ملامسة الواقع، واعد التخطيط دون تسميته فشلا\", \"emoji\": \"\\U0001F4C5\"}]",
            "tags": "قيادة, ادارة, فرق",
            "extra_metadata": {
                "requirements": "[{\"text\": \"بضع سنوات من الخبرة في فريق، او فريق على وشك التكون حولك\"}, {\"text\": \"مشكلة تتجنبها حاليا — احضر الحقيقية، لا الافتراضية\"}]",
                "instructor": {"name": "", "title": "مدير تصميم", "bio": "يدير فريق تصميم صغير ويقضي وقتا اكثر على العملية منه على البكسلات."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
    "Intro to 3D with Blender": {
        "fr": {
            "name": "Initiation a la 3D avec Blender",
            "description": "Modelisation, eclairage et un rendu de produit. Rythme lent, pas d obsession des raccourcis, beaucoup de sauvegardes. On termine avec un rendu que vous pouvez mettre sur une page d accueil et les reglages notes pour le reproduire plus tard.",
            "about": "En preparation. Je reconstruis les lecons de modelisation parce que la premiere version allait trop vite. Les retours sont les bienvenus de la part de ceux qui l essaient.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"Modeliser un objet simple proprement, avec une topologie qui tient quand quelqu un d autre ouvre le fichier\", \"emoji\": \"\\U0001F9F1\"}, {\"id\": \"learning-1\", \"text\": \"Eclairer une scene avec trois lumieres et comprendre ce que chacune apporte au produit\", \"emoji\": \"\\U0001F4A1\"}, {\"id\": \"learning-2\", \"text\": \"Rendre sans attendre toute la nuit, en utilisant les reglages qui comptent et en ignorant le reste\", \"emoji\": \"\\U0001F5A5\"}, {\"id\": \"learning-3\", \"text\": \"Exporter un plateau tournant pour un portfolio qui se charge sur une page sans bloquer le navigateur\", \"emoji\": \"\\U0001F3AC\"}]",
            "tags": "blender, 3d, rendu",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Blender installe, version quatre ou plus recente, avec environ dix gigaoctets d'espace disque libre\"}, {\"text\": \"Une machine avec une vraie carte graphique si possible — les graphiques integres fonctionnent, juste plus lentement\"}]",
                "instructor": {"name": "", "title": "Artiste 3D", "bio": "Cree des rendus 3D de produits pour les petits studios et enseigne les raccourcis qui comptent."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
        "ar": {
            "name": "مقدمة الى الثلاثي الابعاد مع Blender",
            "description": "النمذجة والاضاءة وصورة منتج مظللة. وتيرة بطيئة ولا تقديس للاختصارات وكثير من حفظ الملف. ننتهي بصورة يمكنك وضعها على صفحة هبوط والاعدادات مدونة لتكررها لاحقا.",
            "about": "قيد الاعداد. اعيد بناء دروس النمذجة لان النسخة الاولى كانت سريعة جدا. ارحب بالملاحظات من اي شخص يجربها.",
            "learnings": "[{\"id\": \"learning-0\", \"text\": \"صمم كائنا بسيطا ونظيفا، بطوبولوجيا تصمد عندما يفتح شخص اخر الملف\", \"emoji\": \"\\U0001F9F1\"}, {\"id\": \"learning-1\", \"text\": \"اضئ مشهدا بثلاثة اضواء وافهم ما يفعله كل منها بالمنتج\", \"emoji\": \"\\U0001F4A1\"}, {\"id\": \"learning-2\", \"text\": \"اعرض دون انتظار طوال الليل، باستخدام الاعدادات المهمة وتجاهل الباقي\", \"emoji\": \"\\U0001F5A5\"}, {\"id\": \"learning-3\", \"text\": \"صدر قرصا دوارا لمحفظة اعمال يتم تحميلها على صفحة دون تعطيل المتصفح\", \"emoji\": \"\\U0001F3AC\"}]",
            "tags": "blender, 3d, عرض",
            "extra_metadata": {
                "requirements": "[{\"text\": \"Blender مثبت، الاصدار الرابع او احدث، مع حوالي عشرة غيغابايت من مساحة القرص الحرة\"}, {\"text\": \"جهاز ببطاقة رسوميات حقيقية اذا امكن — الرسوميات المدمجة تعمل، لكن بشكل ابطأ\"}]",
                "instructor": {"name": "", "title": "فنان ثلاثي الابعاد", "bio": "ينتج صورا ثلاثية الابعاد للمنتجات للاستوديوهات الصغيرة ويعلم الاختصارات المهمة."},
                "target_audience": {"for": [], "not_for": []},
            },
        },
    },
}

COLLECTIONS = [
    ("Backend Starter Pack", "Start with the backend course, then the SQL and API courses that sit next to it. Four courses in the order we teach them, with the same project running through all of them. Buy once and keep access to every update.", "PAID", 12000),
    ("Front End Track", "React, mobile and the API behind them. Buy the three together and save a little. The courses share one project, so the screens you build in the first course end up with real data from the last one.", "PAID", 12000),
    ("Data Track", "Pandas and SQL with the same messy shop data, so the two courses reinforce each other. You clean the tables in one course and query them in the other. Ends with one report you can show in an interview.", "PAID", 9000),
    ("Freelance Bundle", "Pricing, contracts and the design skills clients actually pay for. Written for people who already know the tools and now have to send an invoice without apologising for it.", "PAID", 8000),
    ("Motion Pack", "Animation basics plus the video editing course. Useful for reels and product demos. You animate a small interface, cut it with real footage and export something that still loads fast on a phone.", "PUBLIC", None),
    ("Complete Design Path", "Everything we teach about product design, in the order we teach it. Paper first, then layout, type, components and one full case study. If you are starting from zero, this is the shortest route through the catalogue.", "PAID", 18000),
    ("Backend Track", "Python automation and FastAPI. For people who want to build the other half. Two courses that take you from a script running on your laptop to an API other people can actually call.", "PUBLIC", None),
    ("Mobile Track", "React Native plus the API course. Ship something to a phone. The first course gives you the screens, the second gives you a backend that survives a real user hitting refresh.", "PUBLIC", None),
    ("Portfolio Kit", "Case study writing, critique sessions and two portfolio reviews. Not a course so much as a month of feedback. You bring the work, we bring the awkward questions and a deadline you cannot move.", "PUBLIC", None),
    ("Photography Pack", "Product photography and the editing course. Built for shop owners. You learn the light, the angles and the export settings that keep a photo sharp on a marketplace listing.", "PUBLIC", None),
    ("Video Pack", "Resolve plus motion basics. Cut, colour, export, done. Two courses and one small reel at the end, which is usually enough to get the next client or the next conversation.", "PUBLIC", None),
    ("Copy and UX Writing", "Interface text and the freelance course, for people who write more than they draw. Start with button labels and error messages, finish with a rate you can say out loud without flinching.", "PUBLIC", None),
    ("Accessibility Pack", "Audit, fix, ship. Two courses and a checklist. The first one teaches you what to test, the second shows how to make the fixes stick in a team that ships every week.", "PUBLIC", None),
    ("Career Switch Kit", "For people changing fields after thirty. Courses, talks and a study group. No promises about a job in ninety days, just the skills and the words to explain what you can do.", "PUBLIC", None),
    ("Creator Bundle", "Photography, video and podcast production. Everything for a small studio. Three courses, one recording setup and a workflow that fits into a single afternoon.", "PAID", 15000),
    ("Everything Bundle", "All current courses and podcasts. The simple option. One payment, every course we have published, plus new lessons as they land. Useful if you cannot decide and would rather just start.", "PAID", 25000),
    ("2027 Preview Pack", "Draft bundle for next year. Do not publish yet. Placeholder copy so the grid is not empty while we decide what belongs in it and how it should be priced.", "PUBLIC", None),
    ("Team Training Pack", "Draft bundle for company training. Needs pricing approval. Placeholder copy until the invoice question is settled and the first two companies agree on a format.", "PUBLIC", None),
]

COLLECTION_NICHES = {
    "Backend Starter Pack": "design",
    "Front End Track": "coding",
    "Data Track": "coding",
    "Freelance Bundle": "business and career",
    "Motion Pack": "video",
    "Complete Design Path": "design",
    "Backend Track": "coding",
    "Mobile Track": "coding",
    "Portfolio Kit": "design",
    "Photography Pack": "photography",
    "Video Pack": "video",
    "Copy and UX Writing": "writing",
    "Accessibility Pack": "design",
    "Career Switch Kit": "business and career",
    "Creator Bundle": "photography",
    "Everything Bundle": "coding",
    "2027 Preview Pack": "design",
    "Team Training Pack": "business and career",
}

NOTIFICATIONS = [
    ("New lesson unlocked", "Module 4 is live now. Three lessons on auth and one walkthrough where we fix a broken login.", "learning", "activity_unlocked"),
    ("Your certificate is ready", "You finished every lesson in the course. The certificate is waiting in your progress page.", "achievement", "course_completed"),
    ("New reply to your post", "Someone answered your question about database migrations in the Backend Engineering with Python community.", "learning", "discussion_reply"),
    ("Live session in one hour", "The weekly session starts at 18:00. Bring one endpoint you are stuck on.", "system", "live_session"),
    ("Course updated", "Week 5 material was refreshed with the new test fixtures. Pull the latest repository.", "learning", "course_updated"),
    ("You are halfway there", "Twelve of twenty four lessons finished. Keep going, week 3 is the hard one.", "achievement", "progress_milestone"),
    ("New podcast episode", "The Pixel Hour, episode 42. A conversation about shipping slightly ugly work.", "learning", "podcast_episode"),
    ("Your assignment was graded", "Feedback is in. The grade is decent and the notes are useful.", "learning", "assignment_graded"),
    ("Someone reacted to your post", "Your case study thread picked up a few reactions overnight.", "learning", "discussion_reaction"),
    ("Enrollment confirmed", "You are in. The first lesson is short, start there.", "system", "course_enrolled"),
    ("Profile almost complete", "Add a photo and a sentence about yourself so people recognise you in the community.", "system", "profile_incomplete"),
    ("New community member", "Someone joined the community you moderate. Say hello when you have a minute.", "system", "community_member"),
    ("Course finished", "You completed all the lessons. The certificate is in your progress page.", "achievement", "course_completed"),
    ("Payment confirmed", "Your enrollment is active. You can start the course right away.", "system", "payment_confirmed"),
    ("Weekly digest", "Four new discussions, two new lessons and one live session this week.", "system", "weekly_digest"),
    ("Your post was pinned", "A moderator pinned your thread to the top of the community.", "learning", "discussion_pinned"),
    ("New episode in your feed", "The show you follow published a thirty minute episode this morning.", "learning", "podcast_episode"),
    ("Assignment deadline soon", "You have forty eight hours left on the current assignment.", "system", "assignment_deadline"),
    ("Streak reached", "Seven days in a row. Small thing, but it adds up.", "achievement", "streak"),
    ("New course published", "A course you might like just went live in the catalogue.", "learning", "course_published"),
    ("Your comment was hidden", "A moderator hid your comment after a report. Read the community rules before posting again.", "system", "moderation"),
    ("Certificate verified", "Your certificate link was accessed by an employer. Nothing to do, just so you know.", "system", "certificate_verified"),
    ("Welcome to the platform", "Start with one course and finish it before adding a second. That is the whole advice.", "system", "welcome"),
    ("Your cart is waiting", "You left a course in the cart two days ago. It is still there.", "system", "cart_reminder"),
    ("New live session recording", "Missed Thursday? The recording is up for two weeks.", "learning", "live_session_recording"),
    ("Discussion worth reading", "A thread about naming components picked up forty replies. Some of it is even useful.", "learning", "discussion_trending"),
]



# ── Activity / lesson translations ──────────────────────────────────
ACTIVITY_TRANSLATIONS: dict[str, dict[str, dict]] = {
    "How this course works": {
        "ar": {
            'name': 'كيف تعمل هذه الدورة',
            'resources': [
                {
                    'url': 'https://docs.google.com/document/d/example',
                    'name': 'دليل الدورة ومنهجها',
                },
                {
                    'url': 'https://github.com/example/backend-starter',
                    'name': 'رابط مستودع القالب',
                },
                {
                    'url': 'https://community.example.com/course-intro',
                    'name': 'مجتمع المناقشات',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'مقطع فيديو يوم الاثنين',
                        'تمرين على المشروع خلال الأسبوع',
                        'مراجعة طلب السحب يوم الجمعة',
                    ],
                    'title': 'إيقاع أسبوع واحد',
                },
                {
                    'items': [
                        'لا توجد تمارين منفصلة عن الواقع',
                        'كل مفهوم تتعلمه يظهر فوراً في الكود الذي تكتبه',
                        'بنهاية الدورة لديك خدمة حقيقية يمكنك عرضها',
                    ],
                    'title': 'المشروع هو المنهج',
                },
                {
                    'items': [
                        'اقرأ رسالة الخطأ بصوت عالٍ أولاً',
                        'انشر سؤالك مع الكود الذي جربته',
                        'أجب على شخص آخر - الشرح يعمق فهمك',
                    ],
                    'title': 'كيف تحصل على المساعدة',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'ستة أسابيع.',
                    'question': 'كم عدد الأسابيع في هذه الدورة؟',
                },
                {
                    'answer': 'بحلول يوم الخميس.',
                    'question': 'متى يتم إرسال التمرين كل أسبوع؟',
                },
                {
                    'answer': 'مراجعة طلبات السحب.',
                    'question': 'ما الذي يحدث يوم الجمعة؟',
                },
                {
                    'answer': 'خدمة خلفية حقيقية تعمل على خادم.',
                    'question': 'ماذا تبني بحلول نهاية الدورة؟',
                },
                {
                    'answer': 'لا، كل شيء تتعلمه يظهر في الكود الذي تكتبه.',
                    'question': 'هل توجد محاضرات نظرية منفصلة؟',
                },
                {
                    'answer': 'اقرأ رسالة الخطأ بصوت عالٍ.',
                    'question': 'ما هو أول شيء تفعله عندما تتعثر؟',
                },
            ],
            'learning_objectives': [
                'رؤية شكل الأسابيع الستة قبل الالتزام بها',
                'معرفة ما يطلبه منك كل أسبوع وكم من الوقت يستغرق',
                'فهم كيف تبدو المخرجات النهائية قبل أن تبدأ',
            ],
        },
        "fr": {
            'name': 'Comment fonctionne ce cours',
            'learning_objectives': [
                'Voir à quoi ressemblent les six semaines avant de s\'engager',
                'Savoir ce que chaque semaine exige et combien de temps cela prend',
                'Comprendre à quoi ressemble le résultat final avant de commencer',
            ],
            'takeaways': [
                {
                    'title': 'Rythme d\'une semaine',
                    'items': [
                        'Vidéo le lundi',
                        'Exercice sur le projet pendant la semaine',
                        'Revue de pull request le vendredi',
                    ],
                },
                {
                    'title': 'Le projet est le programme',
                    'items': [
                        'Pas d\'exercices déconnectés de la réalité',
                        'Chaque concept appris apparaît immédiatement dans le code',
                        'À la fin du cours, vous avez un vrai service à montrer',
                    ],
                },
                {
                    'title': 'Comment obtenir de l\'aide',
                    'items': [
                        'Lisez le message d\'erreur à voix haute d\'abord',
                        'Posez votre question avec le code que vous avez essayé',
                        'Répondez à quelqu\'un d\'autre — expliquer approfondit la compréhension',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Guide du cours et programme',
                    'url': 'https://docs.google.com/document/d/example',
                },
                {
                    'name': 'Lien vers le dépôt template',
                    'url': 'https://github.com/example/backend-starter',
                },
                {
                    'name': 'Communauté de discussion',
                    'url': 'https://community.example.com/course-intro',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Combien de semaines dure ce cours ?',
                    'answer': 'Six semaines.',
                },
                {
                    'question': 'Quand l\'exercice doit-il être envoyé chaque semaine ?',
                    'answer': 'Avant jeudi.',
                },
                {
                    'question': 'Que se passe-t-il le vendredi ?',
                    'answer': 'Revue des pull requests.',
                },
                {
                    'question': 'Que construisez-vous à la fin du cours ?',
                    'answer': 'Un vrai service backend qui tourne sur un serveur.',
                },
                {
                    'question': 'Y a-t-il des cours théoriques séparés ?',
                    'answer': 'Non, tout ce que vous apprenez apparaît dans le code que vous écrivez.',
                },
                {
                    'question': 'Quelle est la première chose à faire quand on est bloqué ?',
                    'answer': 'Lire le message d\'erreur à voix haute.',
                },
            ],
        },
    },
    "What you need before we start": {
        "ar": {
            'name': 'ماذا تحتاج قبل أن نبدأ',
            'resources': [
                {
                    'url': 'https://www.python.org/downloads/',
                    'name': 'رابط تحميل بايثون',
                },
                {
                    'url': 'https://git-scm.com/downloads',
                    'name': 'رابط تحميل git',
                },
                {
                    'url': 'https://github.com/github/gitignore/blob/main/Python.gitignore',
                    'name': 'قالب .gitignore لبايثون',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'بايثون 3.11 أو أحدث',
                        'محرر نصوص - VS Code أو PyCharm أو Neovim',
                        'git ويفضل حساب على GitHub أو GitLab',
                    ],
                    'title': 'البرمجيات التي تحتاجها',
                },
                {
                    'items': [
                        'مجلد مشروع فارغ باسم backend-course',
                        'ملف README.md يحتوي على جملة تصف الدورة',
                        'ملف .gitignore لتجنب رفع الملفات غير الضرورية',
                    ],
                    'title': 'هيكل المجلدات قبل البداية',
                },
                {
                    'items': [
                        'شغّل python --version في الطرفية',
                        'شغّل git --version للتأكد من تثبيت git',
                        'أنشئ مستودعاً فارغاً وادفع التزاماً أولياً',
                    ],
                    'title': 'اختبار الإعداد',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': '3.11.',
                    'question': 'ما هو إصدار بايثون الأدنى المطلوب؟',
                },
                {
                    'answer': 'ليشرح ما يفعله المشروع لأي شخص يفتح المستودع.',
                    'question': 'لماذا تحتاج إلى README.md؟',
                },
                {
                    'answer': 'يمنع رفع الملفات المؤقتة والملفات الحساسة إلى المستودع.',
                    'question': 'ما فائدة ملف .gitignore؟',
                },
                {
                    'answer': 'أي محرر تحبه - VS Code أو PyCharm أو Neovim.',
                    'question': 'أي محرر نصوص موصى به؟',
                },
                {
                    'answer': 'بتشغيل الأمر python --version في الطرفية.',
                    'question': 'كيف تتأكد أن بايثون مثبت بشكل صحيح؟',
                },
                {
                    'answer': 'تحقق من متغير PATH وأعد تشغيل الطرفية.',
                    'question': 'ماذا تفعل إذا لم يتعرف الطرفية على python؟',
                },
            ],
            'learning_objectives': [
                'تثبيت بايثون وإنشاء مجلد مشروع نظيف',
                'إعداد git ومخزن عن بعد قبل الدرس الأول',
                'تأكيد أن كل شيء يعمل بأمر واحد في الطرفية',
            ],
        },
        "fr": {
            'name': 'Ce qu\'il vous faut avant de commencer',
            'learning_objectives': [
                'Installer Python et créer un dossier de projet propre',
                'Configurer git et un dépôt distant avant la première leçon',
                'Vérifier que tout fonctionne avec une seule commande dans le terminal',
            ],
            'takeaways': [
                {
                    'title': 'Les logiciels nécessaires',
                    'items': [
                        'Python 3.11 ou plus récent',
                        'Un éditeur de code — VS Code, PyCharm ou Neovim',
                        'git et de préférence un compte GitHub ou GitLab',
                    ],
                },
                {
                    'title': 'Structure de dossier avant de commencer',
                    'items': [
                        'Un dossier de projet vide nommé backend-course',
                        'Un fichier README.md avec une phrase décrivant le cours',
                        'Un fichier .gitignore pour éviter de versionner les fichiers inutiles',
                    ],
                },
                {
                    'title': 'Vérification de l\'installation',
                    'items': [
                        'Exécutez python --version dans le terminal',
                        'Exécutez git --version pour vérifier git',
                        'Créez un dépôt vide et poussez un premier commit',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Lien de téléchargement Python',
                    'url': 'https://www.python.org/downloads/',
                },
                {
                    'name': 'Lien de téléchargement git',
                    'url': 'https://git-scm.com/downloads',
                },
                {
                    'name': 'Modèle .gitignore pour Python',
                    'url': 'https://github.com/github/gitignore/blob/main/Python.gitignore',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quelle est la version minimale de Python requise ?',
                    'answer': '3.11.',
                },
                {
                    'question': 'Pourquoi avez-vous besoin d\'un README.md ?',
                    'answer': 'Pour expliquer ce que fait le projet à quiconque ouvre le dépôt.',
                },
                {
                    'question': 'À quoi sert un fichier .gitignore ?',
                    'answer': 'Il empêche les fichiers temporaires et sensibles d\'être versionnés.',
                },
                {
                    'question': 'Quel éditeur de texte est recommandé ?',
                    'answer': 'N\'importe lequel — VS Code, PyCharm ou Neovim.',
                },
                {
                    'question': 'Comment vérifier que Python est correctement installé ?',
                    'answer': 'En exécutant python --version dans le terminal.',
                },
                {
                    'question': 'Que faire si le terminal ne reconnaît pas python ?',
                    'answer': 'Vérifiez la variable PATH et redémarrez le terminal.',
                },
            ],
        },
    },
    "Python, dependencies and a folder layout you can live with": {
        "ar": {
            'name': 'بايثون، الاعتماديات وهيكل مجلد تعيش معه براحة',
            'resources': [
                {
                    'url': 'https://docs.python.org/3/library/venv.html',
                    'name': 'توثيق venv',
                },
                {
                    'url': 'https://docs.python-guide.org/writing/structure/',
                    'name': 'دليل هيكلة مشاريع بايثون',
                },
                {
                    'url': 'https://pip.pypa.io/en/stable/cli/pip_freeze/',
                    'name': 'تجميد الاعتماديات',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'python -m venv .venx تنشئ بيئة نظيفة',
                        'تفعيلها قبل تثبيت أي حزمة',
                        'لا ترفع مجلد .venv إلى المستودع أبداً',
                    ],
                    'title': 'البيئة الافتراضية أولاً',
                },
                {
                    'items': [
                        'app/ للمكتبة الرئيسية',
                        'tests/ للاختبارات',
                        'أسماء واضحة واختصارات مقروءة',
                    ],
                    'title': 'هيكل مجلدات يتحمل النمو',
                },
                {
                    'items': [
                        'requirements.txt يسرد كل حزمة وسطر واحد لكل منها',
                        'ثبتها بـ pip install -r requirements.txt',
                        'لا تثبت الحزم واحدة تلو الأخرى يدوياً',
                    ],
                    'title': 'الاعتماديات في ملف واحد',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'python -m venv .venv',
                    'question': 'ما الأمر الذي ينشئ بيئة افتراضية؟',
                },
                {
                    'answer': 'لأنه خاص بنظام كل مطور ويمكن إعادة إنشائه من requirements.txt.',
                    'question': 'لماذا لا نرفع مجلد .venv إلى git؟',
                },
                {
                    'answer': 'بأمر pip install -r requirements.txt',
                    'question': 'كيف نثبت كل الاعتماديات مرة واحدة؟',
                },
                {
                    'answer': 'requirements.txt',
                    'question': 'ما اسم الملف الذي يسرد الاعتماديات عادةً؟',
                },
                {
                    'answer': 'حتى يفهم أي مطور يفتح المشروع هيكل المجلدات.',
                    'question': 'لماذا نستخدم أسماء ملفات واضحة بدلاً من الاختصارات الغامضة؟',
                },
                {
                    'answer': 'عند بدء مشروع جديد، لكل مشروع بيئته المستقلة.',
                    'question': 'متى تحتاج إلى بيئة افتراضية جديدة؟',
                },
            ],
            'learning_objectives': [
                'فصل اعتماديات المشروع عن اعتماديات النظام باستخدام البيئة الافتراضية',
                'تنظيم المجلدات بطريقة تنمو مع المشروع ولا تحتاج إعادة هيكلة',
                'تجميد الاعتماديات في ملف requirements.txt يمكن لأي شخص إعادة إنتاجه',
            ],
        },
        "fr": {
            'name': 'Python, dépendances et une structure de dossiers durable',
            'learning_objectives': [
                'Structurer un projet pour qu\'il reste lisible à 10 000 lignes',
                'Isoler les dépendances avec un environnement virtuel et pyproject.toml',
                'Écrire un fichier main.py qui se lance et s\'arrête proprement',
            ],
            'takeaways': [
                {
                    'title': 'Structure de projet',
                    'items': [
                        'Un dossier src/ pour le code, pas des fichiers à la racine',
                        'Un dossier tests/ à côté de src/',
                        'README.md, pyproject.toml et .gitignore à la racine',
                    ],
                },
                {
                    'title': 'Gestion des dépendances',
                    'items': [
                        'pyproject.toml est le standard moderne',
                        'Un environnement virtuel par projet',
                        'Ne jamais installer de dépendances en global avec pip',
                    ],
                },
                {
                    'title': 'Point d\'entrée',
                    'items': [
                        'main.py est le fichier de démarrage',
                        'Il contient le minimum pour lancer l\'application',
                        'if __name__ == \'__main__\' protège le code contre les imports',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation pyproject.toml',
                    'url': 'https://packaging.python.org/en/latest/tutorials/packaging-projects/',
                },
                {
                    'name': 'Guide des environnements virtuels',
                    'url': 'https://docs.python.org/3/tutorial/venv.html',
                },
                {
                    'name': 'Modèle de structure de projet',
                    'url': 'https://github.com/cookiecutter/cookiecutter',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Où doit se trouver le code source ?',
                    'answer': 'Dans un dossier src/.',
                },
                {
                    'question': 'Où placer les tests ?',
                    'answer': 'Dans un dossier tests/ à côté de src/.',
                },
                {
                    'question': 'Pourquoi pyproject.toml plutôt que requirements.txt ?',
                    'answer': 'C\'est le standard moderne qui gère à la fois les dépendances et la configuration.',
                },
                {
                    'question': 'Quel est l\'intérêt d\'un environnement virtuel ?',
                    'answer': 'Isoler les dépendances de chaque projet pour éviter les conflits.',
                },
                {
                    'question': 'Quel bloc protège le code d\'exécution lors d\'un import ?',
                    'answer': 'if __name__ == \'__main__\'.',
                },
                {
                    'question': 'Comment gérer les secrets dans la configuration ?',
                    'answer': 'Variables d\'environnement, pas de valeurs en dur.',
                },
            ],
        },
    },
    "Git commits that tell the truth": {
        "ar": {
            'name': 'التزامات git تحكي الحقيقة',
            'resources': [
                {
                    'url': 'https://www.conventionalcommits.org/',
                    'name': 'دليل رسائل الالتزامات',
                },
                {
                    'url': 'https://git-scm.com/doc',
                    'name': 'توثيق git الأساسي',
                },
                {
                    'url': 'https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files',
                    'name': 'نصائح gitignore',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'تبدأ بفعل في الأمر (أضف، أصلح، أعد هيكلة)',
                        'تشرح لماذا تم التغيير وليس فقط ماذا',
                        'أقل من 72 حرفاً في السطر الأول',
                    ],
                    'title': 'رسالة الالتزام الجيدة',
                },
                {
                    'items': [
                        'التزام واحد = تغيير واحد منطقي',
                        'يسهل الرجوع عن خطأ معين',
                        'يسهل على المراجع فهم تاريخ المشروع',
                    ],
                    'title': 'التزامات صغيرة متكررة',
                },
                {
                    'items': [
                        'ملفات .env أو أي ملف يحتوي على مفاتيح',
                        'مجلد .venv ومجلدات التخزين المؤقت',
                        'ملفات ثنائية كبيرة أو بيانات اختبار حقيقية',
                    ],
                    'title': 'ما لا ترفعه أبداً',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'شرح لماذا تم التغيير وليس فقط ماذا.',
                    'question': 'ما العنصر الأهم في رسالة الالتزام؟',
                },
                {
                    'answer': 'تغيير واحد منطقي فقط.',
                    'question': 'كم عدد التغييرات التي يجب أن يحتويها الالتزام الواحد؟',
                },
                {
                    'answer': 'لتسهيل الرجوع عن الأخطاء وتاريخ المشروع الواضح.',
                    'question': 'لماذا نفضل الالتزامات الصغيرة؟',
                },
                {
                    'answer': 'أزله من git وأضفه إلى .gitignore فوراً.',
                    'question': 'ماذا تفعل إذا أضفت ملف .env إلى الالتزام؟',
                },
                {
                    'answer': 'لا، أبداً.',
                    'question': 'هل يجب رفع مجلد .venv؟',
                },
                {
                    'answer': 'أقل من 72 حرفاً.',
                    'question': 'ما الطول الموصى به للسطر الأول من رسالة الالتزام؟',
                },
            ],
            'learning_objectives': [
                'كتابة رسالة التزام تصف لماذا وليس ماذا',
                'تقسيم العمل إلى التزامات صغيرة يمكن الرجوع عنها',
                'تجنب رفع الملفات الحساسة أو المؤقتة',
            ],
        },
        "fr": {
            'name': 'Les commits git qui disent la vérité',
            'learning_objectives': [
                'Faire des commits atomiques dont chaque message explique le pourquoi',
                'Travailler avec des branches sans paniquer',
                'Écrire un README qui aide le prochain développeur',
            ],
            'takeaways': [
                {
                    'title': 'Un bon commit',
                    'items': [
                        'Un commit = un changement logique',
                        'Le message explique pourquoi, pas quoi',
                        'Moins de 50 caractères pour le titre, un corps si nécessaire',
                    ],
                },
                {
                    'title': 'Stratégie de branches',
                    'items': [
                        'main est toujours déployable',
                        'Une branche par fonctionnalité ou correctif',
                        'Rebase avant de merger pour garder un historique linéaire',
                    ],
                },
                {
                    'title': 'Pull requests utiles',
                    'items': [
                        'Un titre clair et une description du changement',
                        'Référencez l\'issue si elle existe',
                        'Revue par quelqu\'un d\'autre avant de merger',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Conventions de commit',
                    'url': 'https://www.conventionalcommits.org/',
                },
                {
                    'name': 'Guide des stratégies de branches',
                    'url': 'https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow',
                },
                {
                    'name': 'Documentation git',
                    'url': 'https://git-scm.com/doc',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quelle est la bonne taille pour un commit ?',
                    'answer': 'Un seul changement logique par commit.',
                },
                {
                    'question': 'Que doit expliquer le message de commit ?',
                    'answer': 'Le pourquoi du changement, pas le quoi.',
                },
                {
                    'question': 'Pourquoi une branche par fonctionnalité ?',
                    'answer': 'Pour isoler le travail et faciliter la revue.',
                },
                {
                    'question': 'Qu\'est-ce qu\'un historique linéaire ?',
                    'answer': 'Un historique sans merges superflus, obtenu par rebase.',
                },
                {
                    'question': 'Pourquoi faire une revue avant de merger ?',
                    'answer': 'Pour détecter les erreurs et partager la connaissance.',
                },
                {
                    'question': 'Quand utiliser git rebase ?',
                    'answer': 'Pour intégrer les derniers changements de main dans votre branche.',
                },
            ],
        },
    },
    "Writing your first endpoint": {
        "ar": {
            'name': 'كتابة أول نقطة نهاية',
            'resources': [
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/first-steps/',
                    'name': 'توثيق FastAPI - الخطوات الأولى',
                },
                {
                    'url': 'https://www.uvicorn.org/',
                    'name': 'توثيق uvicorn',
                },
                {
                    'url': 'https://curl.se/docs/manual.html',
                    'name': 'اختبار النقاط باستخدام curl',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'from fastapi import FastAPI ثم app = FastAPI()',
                        'مزخرف @app.get(\'/health\') يحدد المسار',
                        'الدالة تعيد قاموساً يتحول تلقائياً إلى JSON',
                    ],
                    'title': 'أصغر نقطة نهاية',
                },
                {
                    'items': [
                        'uvicorn main:app --reload يشغل الخادم',
                        'curl http://localhost:8000/health يختبر النقطة',
                        'التوثيق التلقائي متاح في /docs',
                    ],
                    'title': 'شغّلها واختبرها',
                },
                {
                    'items': [
                        'كل مسار يعبر عن مورد واحد',
                        'أسماء الجمع للموارد: /items و /users',
                        'مسارات متداخلة للعلاقات: /users/{id}/orders',
                    ],
                    'title': 'مسارات ذات معنى',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': '@app.get(\'/path\')',
                    'question': 'ما المزخرف الذي ينشئ نقطة نهاية GET؟',
                },
                {
                    'answer': 'uvicorn main:app --reload',
                    'question': 'ما الأمر الذي يشغل خادم FastAPI؟',
                },
                {
                    'answer': 'في /docs.',
                    'question': 'أين تجد التوثيق التلقائي لواجهة API؟',
                },
                {
                    'answer': 'قاموس بايثون يتحول إلى JSON.',
                    'question': 'ماذا تعيد دالة المسار افتراضياً؟',
                },
                {
                    'answer': 'للتعبير عن مجموعة من الموارد بدلاً من مورد واحد.',
                    'question': 'لماذا نستخدم أسماء الجمع للموارد؟',
                },
                {
                    'answer': 'عند تغيير الكود، لكن --reload يفعل ذلك تلقائياً.',
                    'question': 'متى تحتاج إلى إعادة تشغيل الخادم؟',
                },
            ],
            'learning_objectives': [
                'إنشاء نقطة نهاية GET تعيد استجابة JSON',
                'تشغيل الخادم واختبار النقطة بالمتصفح أو curl',
                'ربط المسار بدالة بايثون تفعل شيئاً مفيداً',
            ],
        },
        "fr": {
            'name': 'Écrire votre première endpoint',
            'learning_objectives': [
                'Créer une endpoint GET qui renvoie une réponse JSON',
                'Lancer le serveur et tester l\'endpoint avec le navigateur ou curl',
                'Relier une route à une fonction Python qui fait quelque chose d\'utile',
            ],
            'takeaways': [
                {
                    'title': 'La plus petite endpoint',
                    'items': [
                        'from fastapi import FastAPI puis app = FastAPI()',
                        'Le décorateur @app.get(\'/health\') définit la route',
                        'La fonction retourne un dictionnaire converti automatiquement en JSON',
                    ],
                },
                {
                    'title': 'Lancez-la et testez-la',
                    'items': [
                        'uvicorn main:app --reload démarre le serveur',
                        'curl http://localhost:8000/health teste l\'endpoint',
                        'La documentation automatique est disponible sur /docs',
                    ],
                },
                {
                    'title': 'Des routes qui ont du sens',
                    'items': [
                        'Chaque route exprime une ressource unique',
                        'Noms au pluriel pour les ressources : /items, /users',
                        'Routes imbriquées pour les relations : /users/{id}/orders',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation FastAPI - Premiers pas',
                    'url': 'https://fastapi.tiangolo.com/tutorial/first-steps/',
                },
                {
                    'name': 'Documentation uvicorn',
                    'url': 'https://www.uvicorn.org/',
                },
                {
                    'name': 'Tester les endpoints avec curl',
                    'url': 'https://curl.se/docs/manual.html',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quel décorateur crée une endpoint GET ?',
                    'answer': '@app.get(\'/path\')',
                },
                {
                    'question': 'Quelle commande lance le serveur FastAPI ?',
                    'answer': 'uvicorn main:app --reload',
                },
                {
                    'question': 'Où trouver la documentation automatique de l\'API ?',
                    'answer': 'Sur /docs.',
                },
                {
                    'question': 'Que retourne une fonction de route par défaut ?',
                    'answer': 'Un dictionnaire Python converti en JSON.',
                },
                {
                    'question': 'Pourquoi utiliser des noms au pluriel pour les ressources ?',
                    'answer': 'Pour exprimer un ensemble de ressources plutôt qu\'une seule.',
                },
                {
                    'question': 'Quand faut-il redémarrer le serveur ?',
                    'answer': 'Quand le code change, mais --reload le fait automatiquement.',
                },
            ],
        },
    },
    "Paths, query strings and request bodies": {
        "ar": {
            'name': 'المسارات، سلاسل الاستعلام ونصوص الطلبات',
            'resources': [
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/path-params/',
                    'name': 'توثيق FastAPI - المسارات',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/query-params/',
                    'name': 'توثيق FastAPI - معاملات الاستعلام',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/body/',
                    'name': 'توثيق FastAPI - الجسم',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        '/{id} في المسار تصبح معلمة في الدالة',
                        'FastAPI يستنتج النوع من التلميحات',
                        'التحقق من الصحة تلقائي - id يجب أن يكون عدداً صحيحاً',
                    ],
                    'title': 'متغيرات المسار',
                },
                {
                    'items': [
                        'تأتي بعد علامة ? في URL',
                        'قيم اختيارية لها قيمة افتراضية',
                        'مثالية للفلترة والترقيم',
                    ],
                    'title': 'معاملات الاستعلام',
                },
                {
                    'items': [
                        'يُرسل مع طلبات POST و PUT و PATCH',
                        'يُحلل عبر نموذج Pydantic',
                        'التحقق من الصحة يحدث قبل وصوله إلى دالتك',
                    ],
                    'title': 'نص الطلب',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'بإضافته بين قوسين معقوفين في المسار: /items/{id}',
                    'question': 'كيف تحدد متغير مسار في FastAPI؟',
                },
                {
                    'answer': 'اختيارية ولها قيمة افتراضية.',
                    'question': 'هل معاملات الاستعلام إجبارية أم اختيارية؟',
                },
                {
                    'answer': 'في نص الطلب (request body).',
                    'question': 'أين تضع البيانات عند إنشاء مورد جديد؟',
                },
                {
                    'answer': 'يرجع FastAPI خطأ تحقق من الصحة تلقائياً.',
                    'question': 'ماذا يحدث إذا أرسلت نص طلب غير صالح؟',
                },
                {
                    'answer': 'من تلميحات النوع في دالة المسار.',
                    'question': 'كيف يستنتج FastAPI نوع معلمة المسار؟',
                },
                {
                    'answer': 'المسار يحدد المورد، الاستعلام يحدد خيارات إضافية.',
                    'question': 'ما الفرق بين معاملات المسار ومعاملات الاستعلام؟',
                },
            ],
            'learning_objectives': [
                'التعامل مع متغيرات المسار والمعاملات الاختيارية في الاستعلام',
                'قراءة نص طلب JSON والتحقق من صحته عند نقطة الدخول',
                'التمييز بين البيانات التي تأتي في المسار والتي تأتي في الجسم',
            ],
        },
        "fr": {
            'name': 'Chemins, paramètres de requête et corps de requête',
            'learning_objectives': [
                'Gérer les variables de chemin et les paramètres optionnels dans la requête',
                'Lire et valider un corps de requête JSON à l\'entrée',
                'Distinguer les données qui vont dans le chemin de celles qui vont dans le corps',
            ],
            'takeaways': [
                {
                    'title': 'Variables de chemin',
                    'items': [
                        '/{id} dans le chemin devient un paramètre de fonction',
                        'FastAPI déduit le type des annotations',
                        'Validation automatique — id doit être un entier',
                    ],
                },
                {
                    'title': 'Paramètres de requête',
                    'items': [
                        'Ils suivent le ? dans l\'URL',
                        'Valeurs optionnelles avec valeur par défaut',
                        'Idéaux pour le filtrage et la pagination',
                    ],
                },
                {
                    'title': 'Corps de la requête',
                    'items': [
                        'Envoyé avec les requêtes POST, PUT et PATCH',
                        'Analysé via un modèle Pydantic',
                        'La validation a lieu avant qu\'il n\'atteigne votre fonction',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation FastAPI - Paramètres de chemin',
                    'url': 'https://fastapi.tiangolo.com/tutorial/path-params/',
                },
                {
                    'name': 'Documentation FastAPI - Paramètres de requête',
                    'url': 'https://fastapi.tiangolo.com/tutorial/query-params/',
                },
                {
                    'name': 'Documentation FastAPI - Corps de requête',
                    'url': 'https://fastapi.tiangolo.com/tutorial/body/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Comment définir une variable de chemin dans FastAPI ?',
                    'answer': 'En l\'ajoutant entre accolades dans le chemin : /items/{id}',
                },
                {
                    'question': 'Les paramètres de requête sont-ils obligatoires ou optionnels ?',
                    'answer': 'Optionnels avec une valeur par défaut.',
                },
                {
                    'question': 'Où placer les données lors de la création d\'une ressource ?',
                    'answer': 'Dans le corps de la requête (request body).',
                },
                {
                    'question': 'Que se passe-t-il si on envoie un corps de requête invalide ?',
                    'answer': 'FastAPI retourne automatiquement une erreur de validation.',
                },
                {
                    'question': 'Comment FastAPI déduit-il le type d\'un paramètre de chemin ?',
                    'answer': 'Grâce aux annotations de type dans la fonction de route.',
                },
                {
                    'question': 'Quelle est la différence entre paramètres de chemin et de requête ?',
                    'answer': 'Le chemin identifie la ressource, la requête spécifie des options supplémentaires.',
                },
            ],
        },
    },
    "Pydantic models that do not lie": {
        "ar": {
            'name': 'نماذج Pydantic التي لا تكذب',
            'resources': [
                {
                    'url': 'https://docs.pydantic.dev/latest/',
                    'name': 'توثيق Pydantic',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/body/',
                    'name': 'توثيق FastAPI - النماذج',
                },
                {
                    'url': 'https://docs.pydantic.dev/latest/concepts/fields/',
                    'name': 'أنواع الحقول في Pydantic',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'class Item(BaseModel): ثم الحقول',
                        'كل حقل له نوع واضح',
                        'قيم افتراضية للحقول الاختيارية',
                    ],
                    'title': 'تعريف النموذج',
                },
                {
                    'items': [
                        'البيانات السيئة ترفض قبل وصولها إلى منطق الأعمال',
                        'رسائل الخطأ واضحة ومفيدة',
                        'لا حاجة لفحص manual في دالتك',
                    ],
                    'title': 'التحقق عند الحافة',
                },
                {
                    'items': [
                        'يقبل بيانات الطلب ويؤكد صحتها',
                        'يشكل هيكل الاستجابة',
                        'يضمن أن API متسق في كل نقطة نهاية',
                    ],
                    'title': 'نموذج واحد، استخدامان',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'BaseModel.',
                    'question': 'من أي فئة ترث نماذج Pydantic؟',
                },
                {
                    'answer': 'يرجع FastAPI خطأ تحقق من الصحة مع تفاصيل المشكلة.',
                    'question': 'ماذا يحدث عندما ترسل بيانات لا تطابق النموذج؟',
                },
                {
                    'answer': 'نعم، أو يمكنك تعريف نماذج منفصلة لكل حالة.',
                    'question': 'هل يمكن استخدام نفس النموذج للطلب والاستجابة؟',
                },
                {
                    'answer': 'بإعطائه قيمة افتراضية أو استخدام Optional مع None.',
                    'question': 'كيف تجعل حقلاً اختيارياً في Pydantic؟',
                },
                {
                    'answer': 'لنضمن أن البيانات السيئة لا تصل إلى قاعدة البيانات أو منطق الأعمال.',
                    'question': 'لماذا نفضل التحقق عند حافة التطبيق؟',
                },
                {
                    'answer': 'النموذج يعكس بالضبط شكل البيانات ولا يخفي شيئاً.',
                    'question': 'ماذا تعني عبارة Pydantic models that do not lie؟',
                },
            ],
            'learning_objectives': [
                'تعريف نموذج Pydantic بحقول وأنواع واضحة',
                'التحقق من صحة البيانات الواردة عند حافة التطبيق',
                'استخدام النموذج كنمط للاستجابة لضمان الاتساق',
            ],
        },
        "fr": {
            'name': 'Les modèles Pydantic qui ne mentent pas',
            'learning_objectives': [
                'Définir un modèle Pydantic avec des champs et types explicites',
                'Valider les données entrantes à la frontière de l\'application',
                'Utiliser le même modèle comme schéma de réponse pour garantir la cohérence',
            ],
            'takeaways': [
                {
                    'title': 'Définition du modèle',
                    'items': [
                        'class Item(BaseModel): puis les champs',
                        'Chaque champ a un type explicite',
                        'Valeurs par défaut pour les champs optionnels',
                    ],
                },
                {
                    'title': 'Validation à la frontière',
                    'items': [
                        'Les mauvaises données sont rejetées avant la logique métier',
                        'Messages d\'erreur clairs et utiles',
                        'Pas besoin de vérification manuelle dans votre fonction',
                    ],
                },
                {
                    'title': 'Un modèle, deux usages',
                    'items': [
                        'Il accepte et valide les données de la requête',
                        'Il formate la structure de la réponse',
                        'Il garantit une API cohérente sur chaque endpoint',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation Pydantic',
                    'url': 'https://docs.pydantic.dev/latest/',
                },
                {
                    'name': 'Documentation FastAPI - Modèles',
                    'url': 'https://fastapi.tiangolo.com/tutorial/body/',
                },
                {
                    'name': 'Types de champs Pydantic',
                    'url': 'https://docs.pydantic.dev/latest/concepts/fields/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'De quelle classe héritent les modèles Pydantic ?',
                    'answer': 'BaseModel.',
                },
                {
                    'question': 'Que se passe-t-il quand on envoie des données qui ne correspondent pas au modèle ?',
                    'answer': 'FastAPI retourne une erreur de validation avec les détails du problème.',
                },
                {
                    'question': 'Peut-on utiliser le même modèle pour la requête et la réponse ?',
                    'answer': 'Oui, ou on peut définir des modèles séparés pour chaque cas.',
                },
                {
                    'question': 'Comment rendre un champ optionnel dans Pydantic ?',
                    'answer': 'En lui donnant une valeur par défaut ou en utilisant Optional avec None.',
                },
                {
                    'question': 'Pourquoi valider à la frontière de l\'application ?',
                    'answer': 'Pour garantir que les mauvaises données n\'atteignent pas la base de données ou la logique métier.',
                },
                {
                    'question': 'Que signifie \'les modèles Pydantic ne mentent pas\' ?',
                    'answer': 'Le modèle reflète exactement la forme des données et ne cache rien.',
                },
            ],
        },
    },
    "Error responses people can act on": {
        "ar": {
            'name': 'استجابات الخطأ التي يمكن التعامل معها',
            'resources': [
                {
                    'url': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
                    'name': 'رموز حالة HTTP',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/handling-errors/',
                    'name': 'توثيق FastAPI - معالجة الأخطاء',
                },
                {
                    'url': 'https://www.rfc-editor.org/rfc/rfc7807',
                    'name': 'أفضل ممارسات أخطاء REST API',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        '404 للموارد غير الموجودة',
                        '400 للطلبات السيئة',
                        '401 و 403 للمشكلات المتعلقة بالصلاحيات',
                    ],
                    'title': 'رموز الحالة الصحيحة',
                },
                {
                    'items': [
                        'detail يصف المشكلة بلغة البشر',
                        'نفس الهيكل في كل نقطة نهاية',
                        'العميل يعرف أين يبحث عن الرسالة',
                    ],
                    'title': 'جسم خطأ متسق',
                },
                {
                    'items': [
                        'معالج واحد للـ 404 على مستوى التطبيق',
                        'معالج للتحقق من صحة Pydantic',
                        'لا تترك FastAPI يرجع الخطأ الافتراضي دون تخصيص',
                    ],
                    'title': 'معالجة الأخطاء المركزية',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': '404.',
                    'question': 'ما رمز الحالة لمورد غير موجود؟',
                },
                {
                    'answer': '401 غير مصادق، 403 غير مصرح.',
                    'question': 'ما الفرق بين 401 و 403؟',
                },
                {
                    'answer': 'في حقل detail.',
                    'question': 'أين تضع وصف الخطأ في الاستجابة؟',
                },
                {
                    'answer': 'حتى يتمكن العميل من معالجة الأخطاء بطريقة موحدة.',
                    'question': 'لماذا نريد جسماً خطأ متسقاً؟',
                },
                {
                    'answer': '400.',
                    'question': 'ما رمز الحالة لبيانات طلب غير صالحة؟',
                },
                {
                    'answer': 'ترفع HTTPException مع رمز 404.',
                    'question': 'ماذا تفعل عندما لا يجد التطبيق مورداً؟',
                },
            ],
            'learning_objectives': [
                'إرجاع رموز حالة HTTP ذات معنى لكل حالة',
                'بناء جسم خطأ متسق يمكن للعميل تحليله',
                'التعامل مع الأخطاء الشائعة: غير موجود، غير مصرح، طلب سيئ',
            ],
        },
        "fr": {
            'name': 'Des réponses d\'erreur exploitables',
            'learning_objectives': [
                'Retourner des codes HTTP pertinents pour chaque situation',
                'Construire un corps d\'erreur cohérent que le client peut analyser',
                'Gérer les erreurs courantes : introuvable, non autorisé, mauvaise requête',
            ],
            'takeaways': [
                {
                    'title': 'Les bons codes de statut',
                    'items': [
                        '404 pour les ressources introuvables',
                        '400 pour les mauvaises requêtes',
                        '401 et 403 pour les problèmes d\'autorisation',
                    ],
                },
                {
                    'title': 'Corps d\'erreur cohérent',
                    'items': [
                        'detail décrit le problème en langage humain',
                        'Même structure sur chaque endpoint',
                        'Le client sait où chercher le message',
                    ],
                },
                {
                    'title': 'Gestion centralisée des erreurs',
                    'items': [
                        'Un seul gestionnaire pour le 404 au niveau de l\'application',
                        'Un gestionnaire pour la validation Pydantic',
                        'Ne laissez pas FastAPI retourner l\'erreur par défaut sans personnalisation',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Codes de statut HTTP',
                    'url': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
                },
                {
                    'name': 'Documentation FastAPI - Gestion des erreurs',
                    'url': 'https://fastapi.tiangolo.com/tutorial/handling-errors/',
                },
                {
                    'name': 'Bonnes pratiques pour les erreurs REST API',
                    'url': 'https://www.rfc-editor.org/rfc/rfc7807',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quel code de statut pour une ressource introuvable ?',
                    'answer': '404.',
                },
                {
                    'question': 'Quelle est la différence entre 401 et 403 ?',
                    'answer': '401 non authentifié, 403 non autorisé.',
                },
                {
                    'question': 'Où placer la description de l\'erreur dans la réponse ?',
                    'answer': 'Dans le champ detail.',
                },
                {
                    'question': 'Pourquoi vouloir un corps d\'erreur cohérent ?',
                    'answer': 'Pour que le client puisse traiter les erreurs de manière uniforme.',
                },
                {
                    'question': 'Quel code de statut pour des données de requête invalides ?',
                    'answer': '400.',
                },
                {
                    'question': 'Que faire quand l\'application ne trouve pas une ressource ?',
                    'answer': 'Lever une HTTPException avec le code 404.',
                },
            ],
        },
    },
    "Tables, keys and the shape of a user": {
        "ar": {
            'name': 'الجداول، المفاتيح وشكل المستخدم',
            'resources': [
                {
                    'url': 'https://www.postgresql.org/docs/current/datatype.html',
                    'name': 'أنواع بيانات Postgres',
                },
                {
                    'url': 'https://www.postgresql.org/docs/current/tutorial-fk.html',
                    'name': 'المفاتيح الخارجية',
                },
                {
                    'url': 'https://www.postgresql.org/docs/current/datatype-uuid.html',
                    'name': 'UUID في Postgres',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'كل جدول يمثل كياناً واحداً',
                        'id كمفتاح أساسي من type UUID',
                        'created_at و updated_at في كل جدول',
                    ],
                    'title': 'أساسيات الجدول',
                },
                {
                    'items': [
                        'user_id في جدول الطلبات يشير إلى users(id)',
                        'تفرض完整性 البيانات على مستوى قاعدة البيانات',
                        'تحدد ON DELETE CASCADE أو SET NULL حسب الحاجة',
                    ],
                    'title': 'المفاتيح الخارجية تربط الجداول',
                },
                {
                    'items': [
                        'email يجب أن يكون فريداً',
                        'password_hash - أبداً كلمة المرور نفسها',
                        'is_active لحسابات التعطيل بدلاً من الحذف',
                    ],
                    'title': 'شكل المستخدم',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'لتجنب تخمين المعرفات وتسهيل دمج البيانات.',
                    'question': 'لماذا نستخدم UUID بدلاً من integer للمفاتيح الأساسية؟',
                },
                {
                    'answer': 'created_at و updated_at.',
                    'question': 'ما العمودان الموجودان في كل جدول عادةً؟',
                },
                {
                    'answer': 'بمفتاح خارجي user_id يشير إلى users(id).',
                    'question': 'كيف تربط جدول الطلبات بجدول المستخدمين؟',
                },
                {
                    'answer': 'hash مشفر لكلمة المرور.',
                    'question': 'ماذا تخزن بدلاً من كلمة المرور نفسها؟',
                },
                {
                    'answer': 'لضمان عدم وجود حسابين بنفس البريد.',
                    'question': 'لماذا نجعل البريد الإلكتروني فريداً؟',
                },
                {
                    'answer': 'عند حذف مستخدم، تحذف تلقائياً كل البيانات المرتبطة به.',
                    'question': 'ما فائدة ON DELETE CASCADE؟',
                },
            ],
            'learning_objectives': [
                'تصميم جدول مستخدم بحقول وأنواع مناسبة',
                'اختيار مفتاح أساسي والمفاتيح الخارجية للعلاقات',
                'كتابة استعلام INSERT وإرجاع الصف المُنشأ',
            ],
        },
        "fr": {
            'name': 'Tables, clés et la forme d\'un utilisateur',
            'learning_objectives': [
                'Concevoir une table utilisateur avec des champs et types appropriés',
                'Choisir une clé primaire et des clés étrangères pour les relations',
                'Écrire une requête INSERT et retourner la ligne créée',
            ],
            'takeaways': [
                {
                    'title': 'Bases d\'une table',
                    'items': [
                        'Chaque table représente une entité unique',
                        'id comme clé primaire de type UUID',
                        'created_at et updated_at dans chaque table',
                    ],
                },
                {
                    'title': 'Les clés étrangères relient les tables',
                    'items': [
                        'user_id dans la table commandes référence users(id)',
                        'L\'intégrité est appliquée au niveau de la base de données',
                        'ON DELETE CASCADE ou SET NULL selon le besoin',
                    ],
                },
                {
                    'title': 'La forme d\'un utilisateur',
                    'items': [
                        'email doit être unique',
                        'password_hash — jamais le mot de passe en clair',
                        'is_active pour désactiver les comptes plutôt que les supprimer',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Types de données Postgres',
                    'url': 'https://www.postgresql.org/docs/current/datatype.html',
                },
                {
                    'name': 'Clés étrangères',
                    'url': 'https://www.postgresql.org/docs/current/tutorial-fk.html',
                },
                {
                    'name': 'UUID dans Postgres',
                    'url': 'https://www.postgresql.org/docs/current/datatype-uuid.html',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Pourquoi utiliser UUID plutôt que integer pour les clés primaires ?',
                    'answer': 'Pour éviter la devinette des identifiants et faciliter la fusion de données.',
                },
                {
                    'question': 'Quelles colonnes trouve-t-on généralement dans chaque table ?',
                    'answer': 'created_at et updated_at.',
                },
                {
                    'question': 'Comment reliez-vous une table de commandes à une table d\'utilisateurs ?',
                    'answer': 'Avec une clé étrangère user_id qui référence users(id).',
                },
                {
                    'question': 'Que stockez-vous à la place du mot de passe en clair ?',
                    'answer': 'Un hash crypté du mot de passe.',
                },
                {
                    'question': 'Pourquoi rendre l\'email unique ?',
                    'answer': 'Pour garantir qu\'il n\'y a pas deux comptes avec le même email.',
                },
                {
                    'question': 'À quoi sert ON DELETE CASCADE ?',
                    'answer': 'Quand un utilisateur est supprimé, toutes ses données associées sont automatiquement supprimées.',
                },
            ],
        },
    },
    "Queries without guessing": {
        "ar": {
            'name': 'استعلامات دون تخمين',
            'resources': [
                {
                    'url': 'https://www.postgresql.org/docs/current/sql-select.html',
                    'name': 'توثيق SELECT في Postgres',
                },
                {
                    'url': 'https://www.postgresql.org/docs/current/tutorial-join.html',
                    'name': 'دليل JOIN في Postgres',
                },
                {
                    'url': 'https://www.postgresql.org/docs/current/using-explain.html',
                    'name': 'EXPLAIN ANALYZE',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'حدد الأعمدة التي تحتاجها فقط، لا تستخدم SELECT *',
                        'WHERE يصف بالضبط الصفوف التي تريدها',
                        'استخدم LIMIT لمنع النتائج الضخمة',
                    ],
                    'title': 'SELECT الدقيق',
                },
                {
                    'items': [
                        'INNER JOIN عندما تحتاج صفوفاً متطابقة فقط',
                        'LEFT JOIN عندما تريد كل الصفوف من الجدول الأيسر',
                        'تجنب CROSS JOIN إلا إذا كنت متأكداً',
                    ],
                    'title': 'الربط الصحيح',
                },
                {
                    'items': [
                        'اشغّله في psql أو أي عميل قاعدة بيانات أولاً',
                        'تحقق من عدد الصفوف قبل وضعه في الكود',
                        'أضف EXPLAIN ANALYZE للاستعلامات البطيئة',
                    ],
                    'title': 'اختبر استعلامك',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'لأنه يجلب أعمدة غير ضرورية ويبطئ الاستعلام.',
                    'question': 'لماذا نتجنب SELECT * في الإنتاج؟',
                },
                {
                    'answer': 'عندما تريد كل الصفوف من الجدول الأيسر حتى لو لم يكن لها مقابل.',
                    'question': 'متى تستخدم LEFT JOIN؟',
                },
                {
                    'answer': 'تشغيله في psql أو أي عميل قاعدة بيانات.',
                    'question': 'كيف تختبر استعلاماً قبل كتابته في الكود؟',
                },
                {
                    'answer': 'جملة LIMIT.',
                    'question': 'ما الذي يحدد عدد الصفوف المرجعة؟',
                },
                {
                    'answer': 'INNER JOIN يرجع فقط الصفوف المتطابقة، LEFT JOIN يرجع كل صفوف الجدول الأيسر.',
                    'question': 'ما الفرق بين INNER JOIN و LEFT JOIN؟',
                },
                {
                    'answer': 'عندما يكون الاستعلام بطيئاً وتريد معرفة السبب.',
                    'question': 'متى تستخدم EXPLAIN ANALYZE؟',
                },
            ],
            'learning_objectives': [
                'كتابة استعلام SELECT بجمل WHERE شرطية',
                'ربط جدولين باستخدام JOIN الصحيح',
                'اختبار الاستعلام على بيانات حقيقية قبل وضعه في الكود',
            ],
        },
        "fr": {
            'name': 'Des requêtes sans supposition',
            'learning_objectives': [
                'Écrire une requête SELECT qui ne retourne que ce dont vous avez besoin',
                'Utiliser les paramètres liés pour prévenir les injections SQL',
                'Comprendre la différence entre un JOIN et deux requêtes séparées',
            ],
            'takeaways': [
                {
                    'title': 'SELECT précis',
                    'items': [
                        'Ne faites pas SELECT * — nommez les colonnes',
                        'LIMIT et OFFSET pour la pagination',
                        'WHERE filtre au niveau de la base, pas dans votre code',
                    ],
                },
                {
                    'title': 'Paramètres liés',
                    'items': [
                        'Ne concaténez jamais de chaînes dans une requête',
                        'Utilisez :param ou %s selon la bibliothèque',
                        'La base de données échappe automatiquement les valeurs',
                    ],
                },
                {
                    'title': 'JOIN vs requêtes séparées',
                    'items': [
                        'JOIN est une seule opération, deux requêtes sont deux allers-retours',
                        'Les JOINs peuvent être lents si les tables sont grandes',
                        'Parfois deux requêtes simples sont plus rapides qu\'un JOIN complexe',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation SQL SELECT',
                    'url': 'https://www.postgresql.org/docs/current/sql-select.html',
                },
                {
                    'name': 'Prévention des injections SQL',
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
                },
                {
                    'name': 'Guide des JOINs',
                    'url': 'https://www.postgresql.org/docs/current/tutorial-join.html',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Pourquoi éviter SELECT * ?',
                    'answer': 'Pour ne retourner que les colonnes nécessaires et éviter les surprises.',
                },
                {
                    'question': 'Comment empêcher les injections SQL ?',
                    'answer': 'Avec des paramètres liés, jamais de concaténation.',
                },
                {
                    'question': 'Quelle est la différence entre JOIN et deux requêtes ?',
                    'answer': 'Un JOIN est un seul aller-retour, deux requêtes en font deux.',
                },
                {
                    'question': 'Quand utiliser LIMIT et OFFSET ?',
                    'answer': 'Pour la pagination des résultats.',
                },
                {
                    'question': 'Où doit se faire le filtrage des données ?',
                    'answer': 'Dans la base de données avec WHERE, pas dans le code applicatif.',
                },
                {
                    'question': 'Quand deux requêtes simples sont-elles préférables ?',
                    'answer': 'Quand un JOIN complexe ralentit la requête.',
                },
            ],
        },
    },
    "Migrations you can run twice": {
        "ar": {
            'name': 'الترحيلات التي يمكن تشغيلها مرتين',
            'resources': [
                {
                    'url': 'https://alembic.sqlalchemy.org/',
                    'name': 'توثيق Alembic',
                },
                {
                    'url': 'https://www.postgresql.org/docs/current/ddl.html',
                    'name': 'أنماط الترحيل',
                },
                {
                    'url': 'https://medium.com/@rbranson/10-tips-for-writing-database-migrations',
                    'name': 'الترحيلات الآمنة',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'استخدم IF NOT EXISTS لإضافة الجداول',
                        'استخدم IF EXISTS عند حذفها',
                        'كل ترحيل له تراجع match',
                    ],
                    'title': 'الترحيلات الآمنة',
                },
                {
                    'items': [
                        'تشغيل الترحيل مرتين يجب ألا يغير النتيجة',
                        'التحقق من وجود العمود قبل إضافته',
                        'اختبار الترحيل على نسخة من قاعدة البيانات',
                    ],
                    'title': 'قابلية الإعادة',
                },
                {
                    'items': [
                        'اختبر التراجع قبل أن تحتاج إليه',
                        'تأكد من أن التراجع يعيد البيانات الضرورية',
                        'التراجع ليس نسخة احتياطية - لديك نسخة احتياطية منفصلة',
                    ],
                    'title': 'التراجع',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'لضمان أن الترحيل لا يفشل إذا شغلته مرتين.',
                    'question': 'لماذا نستخدم IF NOT EXISTS؟',
                },
                {
                    'answer': 'تعليمات التطبيق وتعليمات التراجع.',
                    'question': 'ماذا يجب أن يحتوي كل ترحيل؟',
                },
                {
                    'answer': 'لا، التراجع والنسخ الاحتياطي شيئان مختلفان.',
                    'question': 'هل التراجع بديل عن النسخ الاحتياطي؟',
                },
                {
                    'answer': 'تشغيله على نسخة مطابقة لقاعدة بيانات الإنتاج.',
                    'question': 'كيف تختبر ترحيلاً قبل تطبيقه على الإنتاج؟',
                },
                {
                    'answer': 'عند إضافة جدول أو عمود أو تغيير هيكل قاعدة البيانات.',
                    'question': 'متى تحتاج إلى كتابة ترحيل؟',
                },
                {
                    'answer': 'قد يكسر التطبيق إذا كان لا يزال يشير إلى ذلك العمود.',
                    'question': 'ما الخطأ في حذف عمود دون ترحيل؟',
                },
            ],
            'learning_objectives': [
                'كتابة ترحيل يضيف جدولاً أو عموداً بأمان',
                'جعل الترحيل قابلاً للإعادة - إذا شغّلته مرتين لن ينكسر',
                'فهم التراجع عن الترحيل قبل أن تحتاج إليه',
            ],
        },
        "fr": {
            'name': 'Des migrations exécutables deux fois',
            'learning_objectives': [
                'Écrire une migration qui ajoute une table ou une colonne en toute sécurité',
                'Rendre la migration réexécutable — si on la lance deux fois, elle ne casse rien',
                'Comprendre le rollback d\'une migration avant d\'en avoir besoin',
            ],
            'takeaways': [
                {
                    'title': 'Migrations sûres',
                    'items': [
                        'Utilisez IF NOT EXISTS pour ajouter des tables',
                        'Utilisez IF EXISTS pour les suppressions',
                        'Chaque migration a un rollback correspondant',
                    ],
                },
                {
                    'title': 'Réexécutabilité',
                    'items': [
                        'Lancer la migration deux fois ne doit pas changer le résultat',
                        'Vérifiez que la colonne n\'existe pas avant de l\'ajouter',
                        'Testez la migration sur une copie de la base',
                    ],
                },
                {
                    'title': 'Rollback',
                    'items': [
                        'Testez le rollback avant d\'en avoir besoin',
                        'Assurez-vous que le rollback restaure les données nécessaires',
                        'Le rollback n\'est pas une sauvegarde — vous avez une sauvegarde séparée',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation Alembic',
                    'url': 'https://alembic.sqlalchemy.org/',
                },
                {
                    'name': 'Modèles de migration',
                    'url': 'https://www.postgresql.org/docs/current/ddl.html',
                },
                {
                    'name': 'Migrations sécurisées',
                    'url': 'https://medium.com/@rbranson/10-tips-for-writing-database-migrations',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Pourquoi utiliser IF NOT EXISTS ?',
                    'answer': 'Pour garantir que la migration n\'échoue pas si elle est exécutée deux fois.',
                },
                {
                    'question': 'Que doit contenir chaque migration ?',
                    'answer': 'Les instructions d\'application et les instructions de rollback.',
                },
                {
                    'question': 'Le rollback remplace-t-il la sauvegarde ?',
                    'answer': 'Non, le rollback et la sauvegarde sont deux choses différentes.',
                },
                {
                    'question': 'Comment tester une migration avant de l\'appliquer en production ?',
                    'answer': 'En l\'exécutant sur une copie de la base de production.',
                },
                {
                    'question': 'Quand faut-il écrire une migration ?',
                    'answer': 'Quand on ajoute une table, une colonne ou qu\'on modifie le schéma de la base.',
                },
                {
                    'question': 'Quel est le risque de supprimer une colonne sans migration ?',
                    'answer': 'L\'application peut planter si elle référence encore cette colonne.',
                },
            ],
        },
    },
    "Passwords, hashing and what never goes in a log": {
        "ar": {
            'name': 'كلمات المرور، التشفير وما لا يدخل السجل أبداً',
            'resources': [
                {
                    'url': 'https://pypi.org/project/bcrypt/',
                    'name': 'bcrypt في بايثون',
                },
                {
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
                    'name': 'OWASP - تخزين كلمات المرور',
                },
                {
                    'url': 'https://pypi.org/project/argon2-cffi/',
                    'name': 'Argon2 في بايثون',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'استخدم bcrypt أو Argon2',
                        'أبداً SHA أو MD5 لكلمات المرور',
                        'كل كلمة مرور لها salt فريد',
                    ],
                    'title': 'التجزئة وليس التشفير',
                },
                {
                    'items': [
                        'ابحث عن المستخدم بالبريد الإلكتروني',
                        'تحقق من التجزئة باستخدام مكتبة متخصصة',
                        'استخدم response موحدة لتجنب تسريب وجود المستخدم',
                    ],
                    'title': 'التحقق من تسجيل الدخول',
                },
                {
                    'items': [
                        'كلمات المرور حتى لو كانت خاطئة',
                        'رموز JWT أو مفاتيح API',
                        'بيانات بطاقات الائتمان أو المعلومات الشخصية الحساسة',
                    ],
                    'title': 'ما لا يسجل أبداً',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'bcrypt أو Argon2.',
                    'question': 'ما المكتبة الموصى بها لتجزئة كلمات المرور؟',
                },
                {
                    'answer': 'لأنه سريع جداً وسهل الاختراق.',
                    'question': 'لماذا لا نستخدم SHA لكلمات المرور؟',
                },
                {
                    'answer': 'لا، أبداً.',
                    'question': 'هل يجب تسجيل كلمة المرور الخاطئة عند فشل تسجيل الدخول؟',
                },
                {
                    'answer': 'قيمة عشوائية تضاف لكل كلمة مرور لجعل كل تجزئة فريدة.',
                    'question': 'ما هو salt في تجزئة كلمة المرور؟',
                },
                {
                    'answer': 'لمنع تسريب ما إذا كان المستخدم موجوداً أم لا.',
                    'question': 'لماذا نستخدم استجابة موحدة عند فشل تسجيل الدخول؟',
                },
                {
                    'answer': 'تدوير المفتاح فوراً وإصلاح سبب التسريب.',
                    'question': 'ماذا تفعل إذا وجدت كلمة مرور في سجل التطبيق؟',
                },
            ],
            'learning_objectives': [
                'تجزئة كلمات المرور بدلاً من تخزينها كنص صريح',
                'التحقق من كلمة المرور عند تسجيل الدخول بأمان',
                'منع تسرب البيانات الحساسة إلى سجلات التطبيق',
            ],
        },
        "fr": {
            'name': 'Mots de passe, hachage et ce qui ne va jamais dans un log',
            'learning_objectives': [
                'Hacher les mots de passe au lieu de les stocker en clair',
                'Vérifier le mot de passe à la connexion de manière sécurisée',
                'Empêcher les données sensibles de fuiter dans les logs',
            ],
            'takeaways': [
                {
                    'title': 'Hachage, pas chiffrement',
                    'items': [
                        'Utilisez bcrypt ou Argon2',
                        'Jamais SHA ou MD5 pour les mots de passe',
                        'Chaque mot de passe a un salt unique',
                    ],
                },
                {
                    'title': 'Vérification de connexion',
                    'items': [
                        'Cherchez l\'utilisateur par email',
                        'Vérifiez le hash avec une bibliothèque spécialisée',
                        'Utilisez une réponse uniforme pour ne pas révéler l\'existence de l\'utilisateur',
                    ],
                },
                {
                    'title': 'Ce qui ne va jamais dans un log',
                    'items': [
                        'Les mots de passe, même erronés',
                        'Les tokens JWT ou clés d\'API',
                        'Les données de carte de crédit ou informations personnelles sensibles',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'bcrypt en Python',
                    'url': 'https://pypi.org/project/bcrypt/',
                },
                {
                    'name': 'OWASP - Stockage des mots de passe',
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
                },
                {
                    'name': 'Argon2 en Python',
                    'url': 'https://pypi.org/project/argon2-cffi/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quelle bibliothèque est recommandée pour hacher les mots de passe ?',
                    'answer': 'bcrypt ou Argon2.',
                },
                {
                    'question': 'Pourquoi ne pas utiliser SHA pour les mots de passe ?',
                    'answer': 'Parce que c\'est trop rapide et donc facile à casser.',
                },
                {
                    'question': 'Faut-il journaliser le mot de passe erroné en cas d\'échec de connexion ?',
                    'answer': 'Non, jamais.',
                },
                {
                    'question': 'Qu\'est-ce qu\'un salt dans le hachage de mot de passe ?',
                    'answer': 'Une valeur aléatoire ajoutée à chaque mot de passe pour rendre chaque hash unique.',
                },
                {
                    'question': 'Pourquoi utiliser une réponse uniforme en cas d\'échec de connexion ?',
                    'answer': 'Pour ne pas révéler si l\'utilisateur existe ou non.',
                },
                {
                    'question': 'Que faire si vous trouvez un mot de passe dans les logs ?',
                    'answer': 'Faire tourner la clé immédiatement et corriger la cause de la fuite.',
                },
            ],
        },
    },
    "Tokens and refresh without confusion": {
        "ar": {
            'name': 'الرموز والتجديد دون ارتباك',
            'resources': [
                {
                    'url': 'https://pyjwt.readthedocs.io/',
                    'name': 'توثيق PyJWT',
                },
                {
                    'url': 'https://jwt.io/introduction',
                    'name': 'دليل JWT الرسمي',
                },
                {
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
                    'name': 'OWAST - إدارة الجلسات',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'وقّع الرمز بسر لا يعرفه إلا الخادم',
                        'ضع معرف المستخدم وتاريخ الانتهاء في الحمولة',
                        'لا تضع كلمة المرور أو بيانات حساسة في JWT',
                    ],
                    'title': 'إنشاء JWT',
                },
                {
                    'items': [
                        'استخرج الرمز من رأس Authorization',
                        'تحقق من التوقيع أولاً',
                        'تحقق من تاريخ الانتهاء ثانياً',
                    ],
                    'title': 'التحقق في كل طلب',
                },
                {
                    'items': [
                        'رمز الوصول قصير العمر - 15 دقيقة',
                        'رمز التحديث طويل العمر - 7 أيام',
                        'رمز التحديث يُلغى عند استخدامه (دوران الرمز)',
                    ],
                    'title': 'دورة حياة الرمز',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'في رأس Authorization: Bearer <token>',
                    'question': 'أين يرسل العميل رمز JWT؟',
                },
                {
                    'answer': 'قصيرة - حوالي 15 دقيقة.',
                    'question': 'كم يجب أن تكون مدة صلاحية رمز الوصول؟',
                },
                {
                    'answer': 'استخدم رمز التحديث للحصول على رمز وصول جديد.',
                    'question': 'ماذا تفعل عندما ينتهي رمز الوصول؟',
                },
                {
                    'answer': 'لا، أبداً.',
                    'question': 'هل يجب وضع كلمة المرور في JWT؟',
                },
                {
                    'answer': 'التوقيع - تأكد من أنه موقع بسر الخادم.',
                    'question': 'ما أول شيء تتحقق منه عند استلام JWT؟',
                },
                {
                    'answer': 'لمنع إعادة استخدام الرمز إذا تم تسريبه.',
                    'question': 'لماذا ندير رمز التحديث عند استخدامه؟',
                },
            ],
            'learning_objectives': [
                'إنشاء رمز JWT بعد تسجيل الدخول بنجاح',
                'التحقق من صحة الرمز في كل طلب محمي',
                'تنفيذ دورة حياة الرمز: الوصول، التحديث، الإلغاء',
            ],
        },
        "fr": {
            'name': 'Tokens et refresh sans confusion',
            'learning_objectives': [
                'Créer un token JWT avec une expiration courte et une signature valide',
                'Implémenter un endpoint de refresh qui délivre un nouveau token',
                'Protéger les routes avec une dépendance qui vérifie le token',
            ],
            'takeaways': [
                {
                    'title': 'Structure d\'un JWT',
                    'items': [
                        'Header + payload + signature',
                        'Le payload contient l\'identité et les claims',
                        'La signature prouve que le token n\'a pas été modifié',
                    ],
                },
                {
                    'title': 'Access et refresh tokens',
                    'items': [
                        'Access token : courte durée (15 minutes)',
                        'Refresh token : longue durée (7 jours)',
                        'Le refresh token est révocable, pas l\'access token',
                    ],
                },
                {
                    'title': 'Protection des routes',
                    'items': [
                        'Une dépendance FastAPI vérifie le token',
                        'Elle extrait l\'utilisateur actuel de la requête',
                        'Si le token est invalide, la route n\'est jamais appelée',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Introduction à JWT',
                    'url': 'https://jwt.io/introduction',
                },
                {
                    'name': 'Documentation PyJWT',
                    'url': 'https://pyjwt.readthedocs.io/',
                },
                {
                    'name': 'Bonnes pratiques JWT',
                    'url': 'https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'De quelles parties se compose un JWT ?',
                    'answer': 'Header + payload + signature.',
                },
                {
                    'question': 'Quelle est la durée de vie typique d\'un access token ?',
                    'answer': '15 minutes.',
                },
                {
                    'question': 'Quelle est la durée de vie typique d\'un refresh token ?',
                    'answer': '7 jours.',
                },
                {
                    'question': 'Le refresh token est-il révocable ?',
                    'answer': 'Oui, contrairement à l\'access token.',
                },
                {
                    'question': 'Comment protéger une route avec FastAPI ?',
                    'answer': 'Avec une dépendance qui vérifie le token.',
                },
                {
                    'question': 'Que se passe-t-il si le token est invalide ?',
                    'answer': 'La route n\'est jamais appelée et une erreur 401 est retournée.',
                },
            ],
        },
    },
    "Roles and the checks people forget": {
        "ar": {
            'name': 'الأدوار والفحوصات التي ينساها الناس',
            'resources': [
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/security/',
                    'name': 'مصادقة FastAPI',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/advanced/security/',
                    'name': 'مزخرفات الأدوار في FastAPI',
                },
                {
                    'url': 'https://auth0.com/docs/get-started/architecture-scenarios/authorization',
                    'name': 'أنماط التحكم في الوصول',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'حقل role في جدول المستخدمين',
                        'قيم مثل admin و user و moderator',
                        'أدوار قليلة واضحة أفضل من نظام معقد',
                    ],
                    'title': 'نظام الأدوار البسيط',
                },
                {
                    'items': [
                        'مزخرف مخصص أو دالة تحقق',
                        'افحص الدور بعد المصادقة',
                        'ارفض ب 403 إذا لم يكن الدور كافياً',
                    ],
                    'title': 'التحقق من الدور',
                },
                {
                    'items': [
                        'نسيان إضافة التحقق إلى نقطة نهاية جديدة',
                        'التحقق من الدور بعد تنفيذ العملية',
                        'التحقق من الدور بدون التحقق من المصادقة أولاً',
                    ],
                    'title': 'الأخطاء الشائعة',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': '403.',
                    'question': 'ما رمز الحالة عندما يكون المستخدم غير مصرح له؟',
                },
                {
                    'answer': 'في حقل role في جدول المستخدمين.',
                    'question': 'أين تخزن دور المستخدم؟',
                },
                {
                    'answer': 'بعد المصادقة، وقبل تنفيذ العملية.',
                    'question': 'متى تتحقق من الدور؟',
                },
                {
                    'answer': 'نسيان إضافة التحقق من الدور.',
                    'question': 'ما الخطأ الشائع عند إضافة نقطة نهاية جديدة؟',
                },
                {
                    'answer': 'أدوار قليلة واضحة أفضل من نظام معقد.',
                    'question': 'هل الأفضل أدوار كثيرة أم قليلة؟',
                },
                {
                    'answer': 'ترجع 403 مع رسالة توضح أن الصلاحية غير كافية.',
                    'question': 'ماذا تفعل إذا وصل مستخدم عادي إلى نقطة نهاية المشرف؟',
                },
            ],
            'learning_objectives': [
                'تعريف أدوار مثل مشرف ومستخدم عادي',
                'التحقق من الدور في نقاط النهاية المحمية',
                'تجنب الأخطاء الشائعة: نسيان التحقق في نقطة نهاية جديدة',
            ],
        },
        "fr": {
            'name': 'Rôles et vérifications qu\'on oublie',
            'learning_objectives': [
                'Ajouter un champ rôle à la table utilisateur',
                'Écrire une dépendance de vérification de rôle réutilisable',
                'Vérifier le rôle dans les routes qui le nécessitent',
            ],
            'takeaways': [
                {
                    'title': 'Modèle de rôles',
                    'items': [
                        'Un champ role dans la table utilisateur',
                        'Rôles simples : admin, editor, viewer',
                        'Évitez les rôles trop nombreux — trois suffisent souvent',
                    ],
                },
                {
                    'title': 'Vérification en dépendance',
                    'items': [
                        'Créez une dépendance require_role(\'admin\')',
                        'Elle vérifie le rôle après l\'authentification',
                        'Réutilisable sur toutes les routes qui en ont besoin',
                    ],
                },
                {
                    'title': 'Pièges courants',
                    'items': [
                        'Oublier de vérifier le rôle sur une route sensible',
                        'Vérifier le rôle après avoir déjà traité les données',
                        'Hardcoder les noms de rôles au lieu d\'utiliser des constantes',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'FastAPI - Dépendances',
                    'url': 'https://fastapi.tiangolo.com/tutorial/dependencies/',
                },
                {
                    'name': 'Contrôle d\'accès par rôle',
                    'url': 'https://en.wikipedia.org/wiki/Role-based_access_control',
                },
                {
                    'name': 'Sécurité des API',
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Où stocker le rôle d\'un utilisateur ?',
                    'answer': 'Dans un champ role de la table utilisateur.',
                },
                {
                    'question': 'Combien de rôles sont généralement suffisants ?',
                    'answer': 'Trois : admin, editor, viewer.',
                },
                {
                    'question': 'Comment vérifier le rôle dans FastAPI ?',
                    'answer': 'Avec une dépendance require_role(\'admin\') réutilisable.',
                },
                {
                    'question': 'Quand doit-on vérifier le rôle ?',
                    'answer': 'Après l\'authentification, avant de traiter les données.',
                },
                {
                    'question': 'Quel est le piège le plus courant avec les rôles ?',
                    'answer': 'Oublier de vérifier le rôle sur une route sensible.',
                },
                {
                    'question': 'Pourquoi utiliser des constantes pour les noms de rôles ?',
                    'answer': 'Pour éviter les fautes de frappe et faciliter la maintenance.',
                },
            ],
        },
    },
    "Your first test that catches a real bug": {
        "ar": {
            'name': 'أول اختبار يكتشف خطأ حقيقياً',
            'resources': [
                {
                    'url': 'https://docs.pytest.org/',
                    'name': 'توثيق pytest',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/tutorial/testing/',
                    'name': 'TestClient في FastAPI',
                },
                {
                    'url': 'https://www.agilealliance.org/glossary/tdd/',
                    'name': 'مقدمة في TDD',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'دالة تبدأ بـ test_',
                        'تؤكد توقعاً باستخدام assert',
                        'شغّلها بـ pytest في الطرفية',
                    ],
                    'title': 'أول اختبار',
                },
                {
                    'items': [
                        'استخدم TestClient من FastAPI',
                        'أرسل طلباً حقيقياً إلى النقطة',
                        'تحقق من رمز الحالة وجسم الاستجابة',
                    ],
                    'title': 'اختبار نقطة النهاية',
                },
                {
                    'items': [
                        'اكتب الاختبار قبل كتابة الإصلاح',
                        'شاهد الاختبار يفشل لتتأكد من أنه يعمل',
                        'ثم اكتب الكود الذي يجعله ينجح',
                    ],
                    'title': 'الفشل أولاً',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'test_',
                    'question': 'بماذا تبدأ أسماء دوال الاختبار في pytest؟',
                },
                {
                    'answer': 'TestClient.',
                    'question': 'ما الأداة المستخدمة لاختبار نقاط نهاية FastAPI؟',
                },
                {
                    'answer': 'رمز الحالة، ثم جسم الاستجابة.',
                    'question': 'ماذا تختبر أولاً في استجابة API؟',
                },
                {
                    'answer': 'للتأكد من أن الاختبار يختبر الشيء الصحيح.',
                    'question': 'لماذا نشاهد الاختبار يفشل أولاً؟',
                },
                {
                    'answer': 'pytest',
                    'question': 'ما الأمر الذي يشغل كل الاختبارات؟',
                },
                {
                    'answer': 'قبل كتابة الكود الذي يصلح المشكلة.',
                    'question': 'متى تكتب الاختبار؟',
                },
            ],
            'learning_objectives': [
                'كتابة اختبار بسيط باستخدام pytest',
                'اختبار نقطة نهاية API - نجاحها وفشلها',
                'تشغيل الاختبارات ورؤية الفشل قبل أن يراه المستخدم',
            ],
        },
        "fr": {
            'name': 'Votre premier test qui attrape un vrai bug',
            'learning_objectives': [
                'Écrire un test qui échoue d\'abord, puis le faire passer',
                'Utiliser le client de test FastAPI pour simuler des requêtes HTTP',
                'Tester une endpoint entière, de la requête à la réponse',
            ],
            'takeaways': [
                {
                    'title': 'Test qui échoue d\'abord',
                    'items': [
                        'Écrivez le test avant le correctif',
                        'Voyez-le échouer — vous savez qu\'il teste quelque chose',
                        'Faites-le passer avec le minimum de code',
                    ],
                },
                {
                    'title': 'Client de test FastAPI',
                    'items': [
                        'from fastapi.testclient import TestClient',
                        'Simule des requêtes HTTP sans lancer de serveur',
                        'Accès à la requête et à la réponse pour les assertions',
                    ],
                },
                {
                    'title': 'Ce qu\'il faut tester',
                    'items': [
                        'Le code de statut',
                        'La structure de la réponse',
                        'Le contenu quand il est déterministe',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation FastAPI - Tests',
                    'url': 'https://fastapi.tiangolo.com/tutorial/testing/',
                },
                {
                    'name': 'Documentation pytest',
                    'url': 'https://docs.pytest.org/',
                },
                {
                    'name': 'Client HTTP pytest',
                    'url': 'https://httpx.readthedocs.io/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quelle est la première étape pour écrire un test ?',
                    'answer': 'Écrire un test qui échoue.',
                },
                {
                    'question': 'Quelle classe de FastAPI permet de tester sans serveur ?',
                    'answer': 'TestClient.',
                },
                {
                    'question': 'Que devez-vous vérifier dans une réponse d\'API ?',
                    'answer': 'Le code de statut, la structure et le contenu.',
                },
                {
                    'question': 'Pourquoi voir le test échouer d\'abord ?',
                    'answer': 'Pour être sûr qu\'il teste vraiment quelque chose.',
                },
                {
                    'question': 'Quel outil de test est recommandé avec FastAPI ?',
                    'answer': 'pytest.',
                },
                {
                    'question': 'Quand le test est-il suffisant ?',
                    'answer': 'Quand il échoue sur le bug et passe après le correctif.',
                },
            ],
        },
    },
    "Fixtures and a separate test database": {
        "ar": {
            'name': 'التجهيزات وقاعدة بيانات اختبار منفصلة',
            'resources': [
                {
                    'url': 'https://docs.pytest.org/en/stable/fixture.html',
                    'name': 'تجهيزات pytest',
                },
                {
                    'url': 'https://fastapi.tiangolo.com/advanced/testing-database/',
                    'name': 'اختبار قاعدة البيانات في FastAPI',
                },
                {
                    'url': 'https://docs.sqlalchemy.org/en/20/orm/session_basics.html#session-frequently-asked-questions',
                    'name': 'SQLAlchemy - جلسات الاختبار',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'مزخرف @pytest.fixture ينشئ دالة تجهيز',
                        'التجهيزة تحضّر البيانات وتعيدها',
                        'كل اختبار يحصل على نسخته الخاصة',
                    ],
                    'title': 'التجهيزات',
                },
                {
                    'items': [
                        'قاعدة بيانات اختبار لا تمس قاعدة التطوير',
                        'أنشئ الجداول قبل الاختبارات',
                        'احذفها بعدها - أو استخدم المعاملات',
                    ],
                    'title': 'قاعدة بيانات منفصلة',
                },
                {
                    'items': [
                        'كل اختبار يبدأ بحالة نظيفة',
                        'لا يعتمد اختبار على بيانات أنشأها اختبار آخر',
                        'الترتيب لا يهم - أي اختبار يمكن تشغيله بمفرده',
                    ],
                    'title': 'عزلة الاختبارات',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': '@pytest.fixture',
                    'question': 'ما المزخرف الذي يحول دالة إلى تجهيزة pytest؟',
                },
                {
                    'answer': 'لعدم تلويث قاعدة بيانات التطوير ببيانات الاختبار.',
                    'question': 'لماذا نحتاج قاعدة بيانات منفصلة للاختبارات؟',
                },
                {
                    'answer': 'باستخدام العزلة - كل اختبار يبدأ بحالة نظيفة.',
                    'question': 'كيف نضمن أن الاختبارات لا تعتمد على بعضها؟',
                },
                {
                    'answer': 'تُنظف - إما بحذف الجداول أو بتراجع المعاملة.',
                    'question': 'ماذا يحدث للبيانات بعد انتهاء الاختبار؟',
                },
                {
                    'answer': 'نعم، لأن كل اختبار مستقل ولا يعتمد على آخر.',
                    'question': 'هل يمكن لأي اختبار أن يعمل بمفرده؟',
                },
                {
                    'answer': 'لتراجع كل التغييرات تلقائياً بعد انتهاء الاختبار.',
                    'question': 'لماذا نستخدم المعاملات في الاختبارات؟',
                },
            ],
            'learning_objectives': [
                'إنشاء تجهيزات pytest لإعداد بيانات الاختبار',
                'تكوين قاعدة بيانات منفصلة للاختبارات',
                'تنظيف البيانات بعد كل اختبار لضمان العزلة',
            ],
        },
        "fr": {
            'name': 'Fixtures et une base de données de test séparée',
            'learning_objectives': [
                'Configurer une base de données de test qui se crée et se détruit à chaque session',
                'Écrire des fixtures pytest réutilisables pour les modèles fréquents',
                'Comprendre l\'isolation des tests — un test qui en influence un autre est un test cassé',
            ],
            'takeaways': [
                {
                    'title': 'Base de test séparée',
                    'items': [
                        'Une base dédiée aux tests, jamais la base de développement',
                        'Créez les tables au début, supprimez-les à la fin',
                        'Chaque test commence avec des données propres',
                    ],
                },
                {
                    'title': 'Fixtures réutilisables',
                    'items': [
                        '@pytest.fixture crée une fixture',
                        'Les fixtures peuvent dépendre d\'autres fixtures',
                        'Une fixture user_session vous évite de recréer l\'utilisateur partout',
                    ],
                },
                {
                    'title': 'Isolation des tests',
                    'items': [
                        'Un test ne doit pas dépendre d\'un autre test',
                        'Chaque test crée ses propres données',
                        'Si l\'ordre d\'exécution change les résultats, vos tests sont fragiles',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation pytest fixtures',
                    'url': 'https://docs.pytest.org/en/stable/fixture.html',
                },
                {
                    'name': 'Configuration d\'une base de test',
                    'url': 'https://docs.sqlalchemy.org/en/20/orm/session_basics.html',
                },
                {
                    'name': 'Tests avec base de données',
                    'url': 'https://madewithml.com/courses/mlops/testing/#database-testing',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Où les tests doivent-ils s\'exécuter ?',
                    'answer': 'Sur une base de données dédiée aux tests.',
                },
                {
                    'question': 'Que crée une fonction décorée par @pytest.fixture ?',
                    'answer': 'Une fixture réutilisable.',
                },
                {
                    'question': 'Un test peut-il dépendre d\'un autre test ?',
                    'answer': 'Non, chaque test doit être indépendant.',
                },
                {
                    'question': 'Comment s\'assurer que les tests sont isolés ?',
                    'answer': 'Chaque test crée ses propres données.',
                },
                {
                    'question': 'Quand les tables doivent-elles être créées ?',
                    'answer': 'Au début de la session de test.',
                },
                {
                    'question': 'Pourquoi une fixture user_session est-elle utile ?',
                    'answer': 'Pour éviter de recréer un utilisateur et une session dans chaque test.',
                },
            ],
        },
    },
    "Reading a stack trace calmly": {
        "ar": {
            'name': 'قراءة تتبع الأخطاء بهدوء',
            'resources': [
                {
                    'url': 'https://docs.python.org/3/library/exceptions.html',
                    'name': 'أخطاء بايثون المضمنة',
                },
                {
                    'url': 'https://realpython.com/python-debugging-with-pdb/',
                    'name': 'دليل تصحيح الأخطاء',
                },
                {
                    'url': 'https://realpython.com/python-traceback/',
                    'name': 'كيف تقرأ تتبع الأخطاء',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'السطر الأخير هو المكان الذي وقع فيه الخطأ',
                        'السطر الذي كتبته أنت هو المهم وليس مكتبة طرف ثالث',
                        'رسالة الخطأ موجودة في النهاية',
                    ],
                    'title': 'اقرأ من الأسفل إلى الأعلى',
                },
                {
                    'items': [
                        'SyntaxError: أخطأت في كتابة الجملة',
                        'AttributeError: الكائن ليس لديه هذا الأسلوب',
                        'TypeError: نوع القيمة لا يناسب ما توقعه',
                    ],
                    'title': 'ثلاثة أنواع من الأخطاء',
                },
                {
                    'items': [
                        'اقرأ رسالة الخطأ كاملة',
                        'اذهب إلى السطر الذي يشير إليه',
                        'افحص القيم في ذلك السطر قبل تغيير أي شيء',
                    ],
                    'title': 'حل منهجي',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'من الأسفل إلى الأعلى.',
                    'question': 'من أين تبدأ قراءة تتبع الخطأ؟',
                },
                {
                    'answer': 'السطر الذي كتبته أنت، وليس أسطر المكتبات.',
                    'question': 'أي سطر في التتبع هو الأكثر أهمية؟',
                },
                {
                    'answer': 'نوع القيمة لا يتطابق مع ما هو متوقع.',
                    'question': 'ما معنى TypeError؟',
                },
                {
                    'answer': 'قراءة رسالة الخطأ كاملة.',
                    'question': 'ما أول شيء تفعله عند مواجهة خطأ؟',
                },
                {
                    'answer': 'SyntaxError خطأ في كتابة الجملة، AttributeError الكائن لا يمتلك ذلك الأسلوب.',
                    'question': 'ما الفرق بين SyntaxError و AttributeError؟',
                },
                {
                    'answer': 'إلى السطر الذي يشير إليه تتبع الخطأ.',
                    'question': 'بعد قراءة الرسالة، إلى أين تذهب؟',
                },
            ],
            'learning_objectives': [
                'تحديد مكان الخطأ الحقيقي في تتبع الأخطاء',
                'تمييز رسالة الخطأ عن المكدس',
                'استخدام تتبع الأخطاء لحل المشكلة بدلاً من الذعر',
            ],
        },
        "fr": {
            'name': 'Lire une trace de pile calmement',
            'learning_objectives': [
                'Lire une trace de pile du bas vers le haut pour trouver l\'origine',
                'Distinguer l\'erreur réelle de ses symptômes',
                'Utiliser un débogueur ou des impressions stratégiques sans paniquer',
            ],
            'takeaways': [
                {
                    'title': 'Lire la trace',
                    'items': [
                        'Commencez par le bas de la trace',
                        'Le haut est le symptôme, le bas est la cause',
                        'Cherchez votre fichier dans la pile — c\'est là que se trouve votre bug',
                    ],
                },
                {
                    'title': 'Erreur vs symptôme',
                    'items': [
                        'AttributeError: NoneType has no attribute X signifie que quelque chose était None',
                        'KeyError signifie que la clé n\'existe pas dans le dictionnaire',
                        'L\'erreur réelle est souvent quelques lignes plus bas que la dernière ligne',
                    ],
                },
                {
                    'title': 'Déboguer sans stress',
                    'items': [
                        'Ajoutez des print() ou utilisez logging',
                        'Un point d\'arrêt avec un débogueur est plus efficace que 50 print()',
                        'Expliquez le problème à voix haute ou à un canard en caoutchouc',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Guide de débogage Python',
                    'url': 'https://realpython.com/python-debugging/',
                },
                {
                    'name': 'Documentation pdb',
                    'url': 'https://docs.python.org/3/library/pdb.html',
                },
                {
                    'name': 'Techniques de débogage',
                    'url': 'https://stackoverflow.com/questions/1623039/python-debugging-tips',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Par où commencer la lecture d\'une trace de pile ?',
                    'answer': 'Par le bas de la trace.',
                },
                {
                    'question': 'Où se trouve l\'erreur réelle dans la trace ?',
                    'answer': 'Souvent quelques lignes plus bas que la dernière ligne.',
                },
                {
                    'question': 'Que signifie AttributeError: NoneType has no attribute X ?',
                    'answer': 'Que quelque chose était None là où on attendait un objet.',
                },
                {
                    'question': 'Quelle est la différence entre un print et un point d\'arrêt ?',
                    'answer': 'Un point d\'arrêt permet d\'inspecter l\'état à ce moment précis.',
                },
                {
                    'question': 'Pourquoi expliquer le problème à voix haute ?',
                    'answer': 'Ça force à formuler clairement le problème et souvent la solution apparaît.',
                },
                {
                    'question': 'Quel est le premier réflexe face à une erreur ?',
                    'answer': 'Lire le message d\'erreur complètement avant de modifier le code.',
                },
            ],
        },
    },
    "Docker without copying a tutorial": {
        "ar": {
            'name': 'Docker دون نسخ درس تعليمي',
            'resources': [
                {
                    'url': 'https://docs.docker.com/reference/dockerfile/',
                    'name': 'مرجع Dockerfile',
                },
                {
                    'url': 'https://docs.docker.com/compose/compose-file/',
                    'name': 'مرجع Compose',
                },
                {
                    'url': 'https://docs.docker.com/language/python/',
                    'name': 'أفضل ممارسات Docker لبايثون',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'صورة أساسية نحيفة: python:3.11-slim',
                        'انسخ requirements.json أولاً للاستفادة من التخزين المؤقت',
                        'شغّل التطبيق بـ CMD وليس ENTRYPOINT الافتراضي',
                    ],
                    'title': 'Dockerfile واضح',
                },
                {
                    'items': [
                        'انسخ الملفات التي تتغير نادراً أولاً',
                        'الاعتماديات في طبقة منفصلة عن الكود',
                        'تغيير الكود لا يعيد تثبيت الاعتماديات',
                    ],
                    'title': 'طبقات التخزين المؤقت',
                },
                {
                    'items': [
                        'خدمة للتطبيق وخدمة لقاعدة البيانات',
                        'متغيرات البيئة في ملف .env',
                        'volume للبيانات الدائمة',
                    ],
                    'title': 'Docker Compose',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'واحدة.',
                    'question': 'كم عملية لكل حاوية؟',
                },
                {
                    'answer': 'لتبقى طبقة الاعتماديات مخزنة مؤقتاً بين تغييرات الكود.',
                    'question': 'لماذا ننسخ requirements.txt قبل الكود؟',
                },
                {
                    'answer': 'في حاويتها الخاصة، وليس داخل صورة API.',
                    'question': 'أين تعمل قاعدة البيانات؟',
                },
                {
                    'answer': 'صورة أصغر وحزم أقل تحتاج التحديث.',
                    'question': 'لماذا نستخدم صورة أساسية نحيفة؟',
                },
                {
                    'answer': 'أدوات البناء وأي شيء لازم فقط لتجميع الاعتماديات.',
                    'question': 'ماذا يجب أن تستبعد الصورة النهائية؟',
                },
                {
                    'answer': 'طبقة المصدر، لأن الاعتماديات مخزنة مؤقتاً بالفعل.',
                    'question': 'ما الذي يُعاد بناؤه بسرعة بعد تغيير الكود؟',
                },
            ],
            'learning_objectives': [
                'كتابة Dockerfile يبني تطبيق بايثون ويعمل',
                'استخدام Docker Compose لتشغيل التطبيق وقاعدة البيانات معاً',
                'فهم كل سطر في Dockerfile بدلاً من لصق أوامر دون فهم',
            ],
        },
        "fr": {
            'name': 'Docker sans copier un tutoriel',
            'learning_objectives': [
                'Écrire un Dockerfile qui construit et exécute l\'application',
                'Comprendre la mise en cache des couches pour des builds rapides',
                'Lancer l\'application dans un conteneur et exposer le port',
            ],
            'takeaways': [
                {
                    'title': 'Dockerfile minimal',
                    'items': [
                        'FROM python:3.11-slim comme base légère',
                        'COPY pyproject.toml puis les dépendances d\'abord',
                        'COPY le reste du code ensuite',
                    ],
                },
                {
                    'title': 'Mise en cache des couches',
                    'items': [
                        'Chaque instruction crée une couche',
                        'Les couches sont mises en cache et réutilisées',
                        'Copiez les fichiers qui changent le moins d\'abord',
                    ],
                },
                {
                    'title': 'Exécution du conteneur',
                    'items': [
                        'docker build -t mon-app . construit l\'image',
                        'docker run -p 8000:8000 mon-app lance le conteneur',
                        'Le port hôte doit correspondre au port du conteneur',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation Docker',
                    'url': 'https://docs.docker.com/',
                },
                {
                    'name': 'Bonnes pratiques Dockerfile',
                    'url': 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/',
                },
                {
                    'name': 'Docker pour Python',
                    'url': 'https://realpython.com/dockerizing-python-applications/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quelle image de base est recommandée pour Python ?',
                    'answer': 'python:3.11-slim.',
                },
                {
                    'question': 'Qu\'est-ce qu\'une couche dans Docker ?',
                    'answer': 'Chaque instruction du Dockerfile crée une couche.',
                },
                {
                    'question': 'Comment optimiser les builds Docker ?',
                    'answer': 'Copier les fichiers qui changent le moins en premier.',
                },
                {
                    'question': 'Quelle commande construit l\'image Docker ?',
                    'answer': 'docker build -t mon-app .',
                },
                {
                    'question': 'Quelle commande lance le conteneur ?',
                    'answer': 'docker run -p 8000:8000 mon-app',
                },
                {
                    'question': 'Que faire si le port hôte est déjà utilisé ?',
                    'answer': 'Utiliser un autre port : docker run -p 8001:8000 mon-app',
                },
            ],
        },
    },
    "Environment variables and secrets": {
        "ar": {
            'name': 'متغيرات البيئة والأسرار',
            'resources': [
                {
                    'url': 'https://12factor.net/config',
                    'name': 'تطبيق الـ 12 عاملاً - الإعدادات',
                },
                {
                    'url': 'https://docs.pydantic.dev/latest/concepts/pydantic_settings/',
                    'name': 'pydantic-settings',
                },
                {
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
                    'name': 'إدارة الأسرار - OWASP',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'أي شيء يتغير بين الأجهزة هو متغير',
                        'الكود يقرأه ولا يكتبه بشكل ثابت',
                        'القيم الافتراضية فقط عندما تكون آمنة',
                    ],
                    'title': 'الإعدادات خارج الكود',
                },
                {
                    'items': [
                        'ملف .env يبقى محلياً',
                        'ارفع ملف example بقيم فارغة',
                        'دور أي سر تم تسريبه',
                    ],
                    'title': 'الأسرار ليست ملفات ترفع',
                },
                {
                    'items': [
                        'اقرأ كل متغير إجباري عند بدء التشغيل',
                        'أوقف التطبيق إذا كان أحدهم مفقوداً',
                        'اذكر اسم المتغير في رسالة الخطأ',
                    ],
                    'title': 'افشل بسرعة وبصوت عالٍ',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'ما إذا كانت تتغير بين البيئات المختلفة.',
                    'question': 'ما الذي يحدد أن القيمة هي إعدادات؟',
                },
                {
                    'answer': 'لا. ارفع ملف example بقيم فارغة بدلاً من ذلك.',
                    'question': 'هل يجب رفع ملف .env؟',
                },
                {
                    'answer': 'يرفض التطبيق بدء التشغيل ويذكر اسم المتغير.',
                    'question': 'ماذا يحدث عندما يكون متغير إجباري مفقوداً؟',
                },
                {
                    'answer': 'في مخزن أسرار المنصة أو البيئة، أبداً في الصورة.',
                    'question': 'أين تنتمي الأسرار في الإنتاج؟',
                },
                {
                    'answer': 'يقرأها من البيئة، ولا يكتبها بشكل ثابت.',
                    'question': 'ماذا يفعل الكود بقيمة الإعدادات؟',
                },
                {
                    'answer': 'فقط عندما تكون القيمة آمنة في كل البيئات.',
                    'question': 'متى نستخدم قيمة افتراضية؟',
                },
            ],
            'learning_objectives': [
                'نقل الإعدادات خارج الكود إلى البيئة',
                'الحفاظ على الأسرار بعيداً عن الصور والمستودعات والسجلات',
                'الفشل عند بدء التشغيل إذا كان متغير إجباري مفقوداً',
            ],
        },
        "fr": {
            'name': 'Variables d\'environnement et secrets',
            'learning_objectives': [
                'Lire les variables d\'environnement dans l\'application',
                'Distinguer les secrets des simples configurations',
                'Ne jamais commit un fichier .env dans le dépôt',
            ],
            'takeaways': [
                {
                    'title': 'Variables d\'environnement',
                    'items': [
                        'os.getenv(\'KEY\', \'default\') lit une variable',
                        'Un fichier .env pour le développement local',
                        'Les vrais secrets vont dans un gestionnaire de secrets en production',
                    ],
                },
                {
                    'title': 'Secrets vs configuration',
                    'items': [
                        'Un secret : clé d\'API, mot de passe DB, JWT secret',
                        'Une configuration : port, niveau de log, URL publique',
                        'Tous les deux passent par l\'environnement',
                    ],
                },
                {
                    'title': 'Sécurité des .env',
                    'items': [
                        'Ajoutez .env à .gitignore',
                        'Créez un fichier .env.example avec des valeurs fictives',
                        'Ne partagez jamais .env par email ou messagerie',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'python-dotenv',
                    'url': 'https://pypi.org/project/python-dotenv/',
                },
                {
                    'name': 'Gestion des secrets',
                    'url': 'https://www.vaultproject.io/',
                },
                {
                    'name': 'Documentation os.getenv',
                    'url': 'https://docs.python.org/3/library/os.html#os.getenv',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quelle fonction Python lit une variable d\'environnement ?',
                    'answer': 'os.getenv(\'KEY\', \'default\')',
                },
                {
                    'question': 'Où mettre les secrets en production ?',
                    'answer': 'Dans un gestionnaire de secrets comme Vault.',
                },
                {
                    'question': 'Quelle est la différence entre un secret et une configuration ?',
                    'answer': 'Un secret est sensible (clé API, mot de passe), une configuration est publique (port, URL).',
                },
                {
                    'question': 'Pourquoi ne pas commit .env ?',
                    'answer': 'Parce qu\'il contient des secrets qui ne doivent pas être dans le dépôt.',
                },
                {
                    'question': 'Que doit contenir .env.example ?',
                    'answer': 'Les mêmes clés que .env mais avec des valeurs fictives.',
                },
                {
                    'question': 'Comment partager les secrets avec l\'équipe ?',
                    'answer': 'Via un gestionnaire de secrets, pas par email ou messagerie.',
                },
            ],
        },
    },
    "Deploying behind a reverse proxy": {
        "ar": {
            'name': 'النشر خادم وكيل عكسي',
            'resources': [
                {
                    'url': 'https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/',
                    'name': 'Nginx كوكيل عكسي',
                },
                {
                    'url': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For',
                    'name': 'MDN - X-Forwarded-For',
                },
                {
                    'url': 'https://letsencrypt.org/docs/',
                    'name': 'Let\'s Encrypt',
                },
            ],
            'takeaways': [
                {
                    'items': [
                        'الشهادات على الوكيل',
                        'التطبيق يبقى على HTTP عادي',
                        'فقط الوكيل معرض للإنترنت',
                    ],
                    'title': 'الوكيل يملك TLS',
                },
                {
                    'items': [
                        'أرسل المضيف الأصلي والبروتوكول',
                        'مرر IP العميل في ترويسة forwarded',
                        'ثق بهذه الترويسات فقط من الوكيل',
                    ],
                    'title': 'مرر الترويسات الصحيحة',
                },
                {
                    'items': [
                        'ابدأ العملية الجديدة قبل إيقاف القديمة',
                        'أرسل الحركة فقط عندما ينجح فحص الصحة',
                        'احتفظ بالنسخة السابقة جاهزة للعودة',
                    ],
                    'title': 'انشر دون ثغرة',
                },
            ],
            'knowledge_checks': [
                {
                    'answer': 'عند الوكيل العكسي.',
                    'question': 'أين تنتهي TLS؟',
                },
                {
                    'answer': 'لأن عناوين URL المطلقة وإعادة التوجيه تُبنى منها.',
                    'question': 'لماذا يجب تمرير ترويسة المضيف الأصلية؟',
                },
                {
                    'answer': 'X-Forwarded-For التي يضعها الوكيل.',
                    'question': 'أي ترويسة تحمل IP العميل الأصلي؟',
                },
                {
                    'answer': 'لا، فقط الوكيل يجب أن يكون متاحاً.',
                    'question': 'هل يجب أن يكون التطبيق متاحاً من الإنترنت؟',
                },
                {
                    'answer': 'يجب أن ينجح فحص الصحة.',
                    'question': 'ماذا يجب أن يحدث قبل تحويل الحركة إلى النسخة الجديدة؟',
                },
                {
                    'answer': 'للعودة إليها في ثوانٍ إذا كان النشر الجديد سيئاً.',
                    'question': 'لماذا نحتفظ بالنسخة السابقة؟',
                },
            ],
            'learning_objectives': [
                'وضع API خادم وكيل والحفاظ على عنوان IP الحقيقي للعميل',
                'تقديم HTTPS دون تغيير كود التطبيق',
                'نشر تحديث دون إسقاط الطلبات',
            ],
        },
        "fr": {
            'name': 'Déploiement derrière un reverse proxy',
            'learning_objectives': [
                'Configurer un reverse proxy (Nginx ou Caddy) devant l\'application',
                'Comprendre le rôle du proxy : TLS, routage, buffering',
                'Déployer la stack complète avec Docker Compose',
            ],
            'takeaways': [
                {
                    'title': 'Pourquoi un reverse proxy',
                    'items': [
                        'Il gère le TLS (HTTPS) à votre place',
                        'Il route les requêtes vers le bon service',
                        'Il bufferise les requêtes et réponses',
                    ],
                },
                {
                    'title': 'Configuration minimale',
                    'items': [
                        'proxy_pass http://localhost:8000 envoie le trafic vers l\'app',
                        'Le proxy écoute sur le port 80/443, l\'app sur un port interne',
                        'Les en-têtes X-Forwarded-* informent l\'app de l\'URL d\'origine',
                    ],
                },
                {
                    'title': 'Docker Compose pour le déploiement',
                    'items': [
                        'Un service pour l\'API, un pour le proxy',
                        'Le réseau interne isole les services',
                        'Les volumes persistent les données',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Documentation Nginx',
                    'url': 'https://nginx.org/en/docs/',
                },
                {
                    'name': 'Documentation Caddy',
                    'url': 'https://caddyserver.com/docs/',
                },
                {
                    'name': 'Documentation Docker Compose',
                    'url': 'https://docs.docker.com/compose/',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Quel est le rôle principal d\'un reverse proxy ?',
                    'answer': 'Gérer le TLS, router les requêtes et bufferiser.',
                },
                {
                    'question': 'Sur quel port le reverse proxy écoute-t-il généralement ?',
                    'answer': '80 (HTTP) ou 443 (HTTPS).',
                },
                {
                    'question': 'Sur quel port l\'application écoute-t-elle derrière le proxy ?',
                    'answer': 'Un port interne, par exemple 8000.',
                },
                {
                    'question': 'Quel en-tête indique l\'URL d\'origine au serveur ?',
                    'answer': 'X-Forwarded-* (X-Forwarded-For, X-Forwarded-Proto, etc.).',
                },
                {
                    'question': 'À quoi sert le réseau interne dans Docker Compose ?',
                    'answer': 'À isoler les services entre eux.',
                },
                {
                    'question': 'Quelle directive Nginx envoie le trafic vers l\'application ?',
                    'answer': 'proxy_pass.',
                },
            ],
        },
    },
    "One router per resource": {
        "fr": {
            'name': 'Un routeur par ressource',
            'learning_objectives': [
                'Répartir les routes dans des fichiers avant que le fichier principal devienne illisible',
                'Monter les routeurs avec un préfixe pour que les chemins restent cohérents',
                'Trouver le code d\'une endpoint en moins de dix secondes',
            ],
            'takeaways': [
                {
                    'title': 'Un fichier par ressource',
                    'items': [
                        'Les réservations dans bookings.py, les utilisateurs dans users.py.',
                        'Le nom du fichier est le nom de la ressource.',
                        'Le fichier main enregistre uniquement les routeurs.',
                        'Un relecteur peut trouver une endpoint en lisant les tags.',
                    ],
                },
                {
                    'title': 'Les préfixes appartiennent au routeur',
                    'items': [
                        'Définir le préfixe une fois lors de l\'inclusion.',
                        'Les routes à l\'intérieur restent courtes.',
                        'Changer un préfixe est une ligne, pas quarante.',
                    ],
                },
                {
                    'title': 'Les tags rendent la documentation utilisable',
                    'items': [
                        'Grouper les endpoints avec un tag.',
                        'La page de documentation reflète votre structure de fichiers.',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Applications FastAPI plus grandes',
                    'url': 'https://fastapi.tiangolo.com/tutorial/bigger-applications/',
                },
                {
                    'name': 'Référence APIRouter',
                    'url': 'https://fastapi.tiangolo.com/reference/apirouter/',
                },
                {
                    'name': 'Modules Python',
                    'url': 'https://docs.python.org/3/tutorial/modules.html',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Combien de ressources un fichier routeur doit-il gérer ?',
                    'answer': 'Une, nommée d\'après la ressource.',
                },
                {
                    'question': 'Où le préfixe /bookings doit-il être déclaré ?',
                    'answer': 'Sur le routeur lors de son inclusion, pas sur chaque route.',
                },
                {
                    'question': 'Que fait le fichier principal après la séparation ?',
                    'answer': 'Crée l\'application et enregistre les routeurs.',
                },
                {
                    'question': 'Que changent les tags ?',
                    'answer': 'Comment les endpoints sont regroupées sur la page de documentation.',
                },
                {
                    'question': 'Pourquoi garder les routes courtes dans un routeur ?',
                    'answer': 'Le préfixe porte déjà le chemin de la ressource.',
                },
                {
                    'question': 'Quel est le signe que la séparation est nécessaire ?',
                    'answer': 'Vous devez faire défiler pour trouver une endpoint.',
                },
            ],
        },
    },
    "Protecting an endpoint end to end": {
        "fr": {
            'name': 'Protéger une endpoint de bout en bout',
            'learning_objectives': [
                'Câbler une dépendance qui rejette les tokens manquants ou expirés',
                'Retourner 401 et 403 pour les bonnes raisons',
                'Le prouver avec deux requêtes, une avec un token et une sans',
            ],
            'takeaways': [
                {
                    'title': 'Une dépendance, pas un if',
                    'items': [
                        'Attacher la vérification à la route.',
                        'Le handler ne s\'exécute jamais sans elle.',
                        'Copier la vérification dans chaque route invite à l\'oubli.',
                    ],
                },
                {
                    'title': 'Savoir quel refus vous envoyez',
                    'items': [
                        'Pas de token ou un mauvais token donne 401.',
                        'Un token valide sans permission donne 403.',
                    ],
                },
                {
                    'title': 'Prouver les trois cas',
                    'items': [
                        'Requête sans token.',
                        'Requête avec un token expiré.',
                        'Requête avec un token valide.',
                        'Une ligne manquante est 404, pas 403.',
                    ],
                },
            ],
            'resources': [
                {
                    'name': 'Sécurité FastAPI',
                    'url': 'https://fastapi.tiangolo.com/tutorial/security/',
                },
                {
                    'name': 'Dépendances FastAPI',
                    'url': 'https://fastapi.tiangolo.com/tutorial/dependencies/',
                },
                {
                    'name': 'Authentification OWASP',
                    'url': 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
                },
            ],
            'knowledge_checks': [
                {
                    'question': 'Où doit vivre la vérification du token ?',
                    'answer': 'Dans une dépendance attachée à la route.',
                },
                {
                    'question': 'Quel code pour une requête sans token ?',
                    'answer': '401 Non autorisé.',
                },
                {
                    'question': 'Quel code pour un token valide sans permission ?',
                    'answer': '403 Interdit.',
                },
                {
                    'question': 'Quel code quand la ligne n\'existe pas ?',
                    'answer': '404 Introuvable.',
                },
                {
                    'question': 'Combien de cas devez-vous tester ?',
                    'answer': 'Trois : pas de token, token expiré, token valide.',
                },
                {
                    'question': 'Pourquoi éviter de copier la vérification dans chaque handler ?',
                    'answer': 'Une route oubliée est une faille, et les dépendances ne peuvent pas être oubliées.',
                },
            ],
        },
    },
}