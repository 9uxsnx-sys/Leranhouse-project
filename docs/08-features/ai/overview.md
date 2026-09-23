# AI Features Overview

> Koodook integrates AI capabilities — including a content Copilot, Magic Blocks for interactive learning elements, course planning assistance, and a RAG-based question-answering system — to enhance course creation and learning experiences.

---

## AI Copilot Features

The **AI Copilot** is embedded in the course content editor, providing context-aware assistance to course creators. It is available as a side panel in the editor interface.

### Content Generation for Course Descriptions

When editing a course or lesson, the Copilot can generate or improve text content:

- **Course descriptions** — Generate compelling course descriptions from keywords or outlines.
- **Learning objectives** — Produce structured, measurable learning outcomes.
- **Lesson summaries** — Condense lesson content into key takeaways.
- **Content expansion** — Expand bullet points into full paragraphs or vice versa.

The Copilot operates within the editor's side panel (`AIEditorSidePanel.tsx`) and sends the current editor content along with the user's instruction to the AI API.

### Editor Integration

The frontend sends requests to the AI API endpoints with the current content context:

```
Editor Content + User Instruction ──► AI API ──► LLM (Gemini)
                                          │
                                          ▼
                                    Generated Text
                                    (streamed back)
```

The editor supports streaming responses for real-time feedback.

### AI Editor Endpoints

The backend exposes several AI endpoints under the AI router:

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/editor/generate` | Generate or rewrite content based on context and instructions |
| `POST /api/ai/editor/complete` | Auto-complete partial content |
| `POST /api/ai/editor/suggest` | Suggest improvements or alternatives |

These endpoints use the `editor.py` service module, which constructs prompts from the editor context and calls the LLM via the `ask_ai_stream()` function.

## Magic Blocks

**Magic Blocks** are AI-generated interactive learning elements that course creators can insert into lessons. They are triggered by the `/blockMagic` command in the editor's slash-command menu.

### Available Magic Block Types

| Block Type | Description |
|---|---|
| **Quiz** | AI-generated multiple-choice or fill-in-the-blank questions based on lesson content |
| **Image** | AI-generated illustrations or diagrams relevant to the content |
| **Video** | AI-suggested video resources or embedded media |
| **PDF** | AI-generated document summaries or reference materials |
| **Embed** | AI-suggested embedded content (external resources) |
| **Math Equation** | AI-generated mathematical expressions and equations |
| **Web Preview** | AI-curated web resource previews |
| **User** | AI-suggested user mentions or contributor highlights |
| **Scenario** | AI-generated interactive learning scenarios for role-play or case studies |
| **Flip Card** | AI-generated interactive flip cards for vocabulary or concept review |

### How Magic Blocks Work

1. The course creator types `/` in the editor and selects a Magic Block type.
2. The frontend sends a request to `POST /api/ai/magicblocks/generate` with the lesson context and the requested block type.
3. The backend constructs a specialized prompt for the requested block type and calls the LLM.
4. The AI returns structured data for the block (e.g., quiz questions and answers, flip card front/back content).
5. The block is rendered in the editor and can be further customized by the creator.

### Magic Block Schemas

Each Magic Block type has a corresponding Pydantic schema in `apps/api/src/services/ai/schemas/magicblocks.py` that defines the expected response structure from the LLM, ensuring type-safe parsing of AI outputs.

## Course Planning Assistance

The course planning feature helps course creators design their curriculum structure using AI.

### How It Works

1. The creator provides a course topic, target audience, and desired number of chapters.
2. The frontend calls `POST /api/ai/courseplanning/generate` with these parameters.
3. The backend (`courseplanning.py` service) constructs a prompt that asks the LLM to generate:
   - A course outline with chapter names and descriptions.
   - Learning objectives for each chapter.
   - Suggested activity types per chapter (video, quiz, reading, etc.).
4. The generated plan is returned as structured data and presented in the UI for review and editing.
5. The creator can accept, modify, or reject the suggested plan before it is saved.

### Course Planning Schemas

The `schemas/courseplanning.py` module defines the input parameters and output structure for the course planning endpoint.

## RAG (Retrieval-Augmented Generation) System

The RAG system enables learners to ask questions about course content and receive answers grounded in the actual course materials. It uses vector similarity search to find relevant content chunks and feeds them as context to the LLM.

### Architecture

```
User Question
      │
      ▼
Embedding Service ──► pgvector (PostgreSQL)
      │                    │
      │                    ▼
      │           Similarity Search
      │           (cosine distance)
      │                    │
      ▼                    ▼
   Question           Retrieved
   Embedding          Context Chunks
      │                    │
      └────────┬───────────┘
               ▼
       LLM Prompt Builder
               │
               ▼
        LLM (Gemini 2.5 Flash)
               │
               ▼
      Streaming Response
      (with source citations)
```

### Key Components

#### Embedding Service

**File:** `apps/api/src/services/ai/rag/embedding_service.py`

Converts text to vector embeddings using the configured embedding model. Embeddings are stored in the `course_embedding` table using PostgreSQL's `pgvector` extension.

#### Content Extraction

**File:** `apps/api/src/services/ai/rag/content_extraction.py`

Extracts and chunks course content (lesson text, activity descriptions, quiz content) for embedding. Content is chunked with overlap to preserve context boundaries.

#### Query Service

**File:** `apps/api/src/services/ai/rag/query_service.py`

The core RAG service:

1. **`query_course_rag()`** — Embeds the user's question, performs a vector similarity search against the `course_embedding` table using the `<=>` (cosine distance) operator, returns the top-K most relevant chunks with source metadata.
2. **`query_course_rag_stream()`** — Combines retrieval with LLM generation. Builds a grounding prompt that includes the retrieved context, then streams the LLM response with source citations.

#### RAG Router

**File:** `apps/api/src/routers/ai/rag.py`

API endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/rag/query` | Ask a question about course content, get a RAG-grounded answer |
| `POST /api/ai/rag/query/stream` | Same as above but with streaming response |
| `POST /api/ai/rag/index` | Trigger re-indexing of course content (admin) |

### Query Modes

The RAG system supports two query modes:

| Mode | Description |
|---|---|
| **course_only** (default) | Answer strictly from course content. Supplementary information outside the course material is wrapped in blockquotes. |
| **general** | Answer from course content AND general knowledge. The LLM freely expands with additional context from its training data. |

### Source Citations

The RAG system includes source metadata with each response, allowing the UI to display which course, chapter, and activity the information came from. Sources are deduplicated and numbered.

## Embedding Pipeline and Vector Storage

### Database

Embeddings are stored in the `course_embedding` table in PostgreSQL using the `pgvector` extension:

```sql
CREATE TABLE course_embedding (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER REFERENCES course(id),
    org_id          INTEGER REFERENCES organization(id),
    activity_uuid   UUID,
    chunk_text      TEXT NOT NULL,
    embedding       vector(768),  -- Dimension depends on embedding model
    source_type     VARCHAR(50),  -- 'lesson', 'quiz', 'description', etc.
    block_uuid      UUID,
    activity_name   VARCHAR(255),
    chapter_name    VARCHAR(255),
    course_name     VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_embedding_course ON course_embedding(course_id);
CREATE INDEX idx_course_embedding_org ON course_embedding(org_id);
```

### Embedding Pipeline Flow

```
Content Saved/Updated
      │
      ▼
Content Extraction
  ├─ Extract text from lesson content
  ├─ Split into chunks (with overlap)
  └─ Store metadata (course, chapter, activity)
      │
      ▼
Embedding Generation
  └─ Call embedding model → vector
      │
      ▼
pgvector Insert/Update
  └─ Store in course_embedding table
```

The embedding pipeline runs:
- Automatically when course content is saved (triggered by content update events).
- On-demand via the admin API (`POST /api/ai/rag/index`).

## Integration with LLM Providers

### Current Provider: Google Gemini

The current implementation uses **Google Gemini** as the LLM provider:

- **Model:** `gemini-2.5-flash` (default for RAG queries)
- **Usage:** Text generation for Copilot, Magic Blocks, course planning, and RAG answers
- **Streaming:** All endpoints support streaming responses via `ask_ai_stream()`

### Base AI Service

**File:** `apps/api/src/services/ai/base.py`

The `ask_ai_stream()` function provides a unified interface for streaming LLM responses:

```python
async def ask_ai_stream(
    question: str,
    message_history: list,
    text_reference: str = "",
    message_for_the_prompt: str = "",
    gemini_model_name: str = "gemini-2.5-flash",
) -> AsyncGenerator[str, None]:
    """Send a prompt to the LLM and stream the response."""
```

### Provider Abstraction

The LLM layer includes abstraction for provider flexibility:

- **`llm/provider.py`** — Provider interface and registry
- **`llm/client.py`** — HTTP client for LLM API calls
- **`llm/embeddings.py`** — Embedding model abstraction
- **`llm/tiers.py`** — Model tier definitions (fast, balanced, high-quality)

This abstraction allows future providers (OpenAI, Claude, local models via Ollama) to be added by implementing the provider interface.

## Current Implementation Status

| Feature | Status | Details |
|---|---|---|
| **AI Copilot (Editor)** | ✅ Implemented | Side panel with content generation, completion, and suggestions |
| **Magic Blocks** | ✅ Implemented | 10+ block types including quiz, image, flip card, scenario |
| **Course Planning** | ✅ Implemented | AI-generated course outlines with chapter structure |
| **RAG System** | ✅ Implemented | Vector search, streaming responses, source citations |
| **Embedding Pipeline** | ✅ Implemented | Automatic indexing on content save, manual re-index API |
| **LLM Provider Abstraction** | 🟡 Partial | Interface defined, only Gemini provider implemented |
| **Admin AI Agent** | 🔴 Planned | Full tool-calling agent for admin analytics and content management |

## Future Roadmap

### Near Term

- **Admin AI Agent** — A LangChain-based agent with tool-calling capabilities that can query databases, run analytics, generate visualizations, and take administrative actions through natural language.
- **Provider expansion** — Add support for OpenAI and Anthropic models, configurable via environment variables.
- **Local model support** — Integration with Ollama for self-hosted deployments that want to use local LLMs.

### Medium Term

- **AI-generated assessments** — Automatic quiz and assignment generation from course content.
- **Personalized learning paths** — AI recommends courses and learning sequences based on user progress and goals.
- **Content translation** — AI-powered translation of course content into multiple languages.

### Long Term

- **AI tutoring** — Interactive one-on-one tutoring powered by the RAG system, with follow-up question handling.
- **Adaptive content** — Course content that adapts difficulty based on learner performance.
- **Voice interaction** — Voice-based Q&A and content narration.

---

> See the [RAG Query Service](../../../apps/api/src/services/ai/rag/query_service.py) for implementation details.
> See the [AI Router](../../../apps/api/src/routers/ai/ai.py) for API endpoint definitions.
> See [Organization Features (Admin Guide)](../../04-admin-guide/org-settings/features.md) for AI feature flag configuration.
