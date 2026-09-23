# Admin AI Agent — Architecture & Implementation Plan

> **Status:** Planned  
> **Target:** Post-redesign release  
> **Access:** Admin-only (Org Admins & Superadmins)

---

## 1. Vision

A **native, high-quality AI agent** embedded directly into the Koodoox platform — accessible only to admin users — that has full read/write access to platform data, can run analytics queries, generate visualizations, create and modify course content, and answer any question about the platform's data. Unlike the current simple LLM wrapper (which just does text-in/text-out chat), this agent uses **tool/function calling** to take real actions within the platform.

---

## 2. Why Not the Current Gemini SDK Approach?

| Aspect | Current (Simple Wrapper) | Admin Agent (Planned) |
|---|---|---|
| **LLM flexibility** | Gemini only | Any LLM — swap via env var (OpenAI, Claude, Gemini, Mistral, local) |
| **Capabilities** | Text chat only | Full tool calling: query DB, run analytics, generate content, trigger actions |
| **Architecture** | Single prompt → response | Agent loop: plan → call tool → observe → decide next step |
| **Framework** | Raw SDK calls | LangChain / LangGraph agent framework |
| **Admin features** | None | Full admin toolset: analytics, content gen, user management, webhooks |
| **Future-proofing** | Locked to Gemini | Provider-agnostic — swap models anytime |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Admin User (Browser)                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Admin AI Agent API (/api/v1/admin/ai)        │
│  • Authenticated + org-scoped (require_org_admin)         │
│  • Rate limited + AI credit checked                       │
│  • SSE streaming for real-time responses                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              LangChain Agent (AgentExecutor)              │
│  • LLM: configurable (Gemini / OpenAI / Claude / etc.)    │
│  • Tools: list of callable functions                      │
│  • Memory: Redis-backed conversation history              │
│  • Callbacks: streaming, logging, credit tracking         │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐
│Analytics│ │Database │ │Content  │ │Platform     │
│Tools    │ │Tools    │ │Gen Tools│ │Action Tools │
└─────────┘ └─────────┘ └─────────┘ └─────────────┘
```

---

## 4. Agent Framework: LangChain / LangGraph

### Why LangChain

- **Industry standard** — largest ecosystem, best documentation, most community support
- **Provider-agnostic** — single `ChatOpenAI()` / `ChatAnthropic()` / `ChatGoogleGenerativeAI()` swap
- **Built-in agent loop** — `AgentExecutor` handles tool selection, execution, and response
- **Streaming support** — native async streaming via `AsyncIteratorCallbackHandler`
- **Memory** — `RedisChatMessageHistory` for persistent conversation state
- **Tool abstraction** — `@tool` decorator to turn any Python function into an AI-callable tool
- **LangGraph** (advanced) — for complex multi-step workflows with conditional branching

### Model Flexibility

```python
# Single env var swap changes the entire agent's LLM:
AGENT_LLM_PROVIDER=gemini     # google-generativeai
AGENT_LLM_PROVIDER=openai     # openai
AGENT_LLM_PROVIDER=anthropic  # anthropic
AGENT_LLM_PROVIDER=ollama     # local models (Llama, Mistral, etc.)
```

---

## 5. Agent Tools — Complete Inventory

### 5.1 Analytics Tools

These tools give the agent access to the full Tinybird analytics pipeline and admin-level course statistics.

| Tool Name | Description | Data Source |
|---|---|---|
| `get_course_analytics(course_uuid)` | Enrollment, completion %, in-progress, certificates | PostgreSQL (admin service) |
| `get_dashboard_metric(metric_name, params)` | Live users, DAU, top courses, enrollment funnel | Tinybird (via analytics API) |
| `get_course_metric(metric_name, course_uuid)` | Activity funnel, learner progress, time per activity | Tinybird (via analytics API) |
| `get_advanced_metric(metric_name, params)` | Cohort retention, dropoff, peak usage hours | Tinybird (Enterprise) |
| `export_analytics(format, query_name, params)` | Export analytics as JSON or CSV | Tinybird + PostgreSQL |
| `visualize_data(query_name, params, chart_type)` | Generate chart-ready data (bar, line, pie, table) | Analytics API → structured output |

**Example admin query:**  
> "Show me the top 5 courses by enrollment this month with completion rates"  
> → Agent calls `get_dashboard_metric("top_courses", {period: "month"})`  
> → Returns structured data → Agent presents as a formatted table

### 5.2 Database Query Tools

These tools allow the agent to read platform data directly through controlled, read-only queries.

| Tool Name | Description |
|---|---|
| `query_users(filters)` | List/search users by name, email, role, status |
| `query_courses(filters)` | List/search courses by name, status, instructor |
| `query_communities(filters)` | List/search communities by name, member count |
| `query_podcasts(filters)` | List/search podcasts and episodes |
| `query_enrollments(course_uuid, filters)` | Get enrollment data for a specific course |
| `get_org_stats()` | Get overall org statistics (users, courses, revenue) |

**All DB queries are read-only.** The agent cannot modify the database through these tools — content creation/modification has dedicated tools (see below).

### 5.3 Content Generation Tools

These tools allow the agent to generate and modify course content. All generated content goes through a **draft → approval** workflow.

| Tool Name | Description |
|---|---|
| `generate_lesson_content(lesson_uuid, style_guide)` | Generate full lesson sections (What You'll Learn, Key Takeaways, Knowledge Check, Resources) based on the lesson's video and title |
| `generate_course_outline(topic, chapters, level)` | Generate a complete course outline with chapters and lessons |
| `generate_knowledge_checks(lesson_uuid, count, difficulty)` | Generate Q&A knowledge checks for a lesson |
| `generate_resource_summary(lesson_uuid)` | Generate a summary and key takeaways from lesson content |
| `suggest_tags(course_uuid)` | Suggest relevant tags for a course based on its content |
| `rewrite_content(content, tone, audience)` | Rewrite existing content with a different tone or for a different audience |

**Content Generation Workflow:**
```
1. Admin adds video to a lesson
2. Admin asks agent: "Generate the full lesson content for this video"
3. Agent analyzes video context + lesson title
4. Agent generates: What You'll Learn → Key Takeaways → Knowledge Checks → Resources
5. Content is saved as DRAFT (not published)
6. Admin reviews and approves → content goes live
```

### 5.4 Platform Action Tools

These tools allow the agent to perform administrative actions within the platform.

| Tool Name | Description |
|---|---|
| `create_course(data)` | Create a new course with outline |
| `update_course(course_uuid, data)` | Update course settings |
| `publish_course(course_uuid)` | Publish a course (make visible to learners) |
| `invite_user(email, role)` | Invite a user to the organization |
| `update_user_role(user_uuid, role)` | Change a user's role |
| `create_webhook(url, events)` | Create a webhook endpoint |
| `trigger_webhook_event(event_type, payload)` | Fire a test webhook event |
| `send_notification(user_uuid, message)` | Send a notification to a user |

### 5.5 Visualization Tools

These tools allow the agent to create visual representations of platform data.

| Tool Name | Description |
|---|---|
| `generate_chart(data, chart_type, title)` | Generate chart configuration (bar, line, pie, area, scatter) |
| `create_report(metrics, period, format)` | Generate a formatted analytics report |
| `compare_periods(metric, period1, period2)` | Compare analytics across two time periods |

**Example:**  
> "Show me enrollment growth over the last 6 months"  
> → Agent queries analytics → generates chart data → returns structured chart config → frontend renders it

---

## 6. Tool Implementation Pattern

Every tool follows the same pattern:

```python
from langchain.tools import tool

@tool
def get_course_analytics(course_uuid: str) -> dict:
    """Get enrollment, completion, and progress stats for a course.
    
    Args:
        course_uuid: The UUID of the course to analyze
    """
    # 1. Auth check (handled by the API layer before agent invocation)
    # 2. Query database or analytics service
    # 3. Return structured data
    
    from src.services.admin.admin import get_course_analytics
    return get_course_analytics(token_user, course_uuid, db_session)
```

All tools are:
- **Type-hinted** — LangChain uses type hints to generate tool schemas for the LLM
- **Docstring-described** — The LLM reads the docstring to decide which tool to call
- **Error-handled** — Every tool returns a clear error message if something fails
- **Audit-logged** — Every tool invocation is logged with user, timestamp, and parameters

---

## 7. Agent Conversation Flow

```
User: "What's our top performing course this month?"

Agent: 
  ┌─ Thought: "I need to check analytics for top courses this month"
  ├─ Action: get_dashboard_metric("top_courses", {period: "month", limit: 1})
  ├─ Observation: {"course_name": "Advanced React", "enrollments": 234, "completion_rate": 68%}
  └─ Response: "Your top course this month is **Advanced React** with 234 enrollments and a 68% completion rate."

User: "Can you generate the lesson content for the first lesson in that course?"

Agent:
  ┌─ Thought: "I need to find the course UUID and first lesson"
  ├─ Action: query_courses({name: "Advanced React"})
  ├─ Observation: {course_uuid: "abc-123", ...}
  ├─ Action: query_course_outline("abc-123")
  ├─ Observation: {chapters: [...], first_lesson_uuid: "lesson-456"}
  ├─ Action: generate_lesson_content("lesson-456", {tone: "professional"})
  ├─ Observation: {content: {...}, status: "draft"}
  └─ Response: "I've generated the lesson content for the first lesson of Advanced React. It's saved as a **draft** — you can review and approve it [here]."
```

---

## 8. Technical Implementation

### 8.1 New Dependencies

```toml
# pyproject.toml additions
langchain = "^0.3.0"
langchain-community = "^0.3.0"
langchain-google-genai = "^2.0.0"   # or
langchain-openai = "^0.2.0"         # or
langchain-anthropic = "^0.2.0"      # etc.
```

### 8.2 New API Endpoints

All under `/api/v1/admin/ai/` — gated by `require_org_admin()`:

| Endpoint | Method | Description |
|---|---|---|
| `/admin/ai/chat` | POST (SSE) | Main agent chat — streaming response with tool calls |
| `/admin/ai/sessions` | GET | List agent conversation sessions |
| `/admin/ai/sessions/{uuid}/messages` | GET | Get session message history |
| `/admin/ai/sessions/{uuid}` | DELETE | Delete a session |
| `/admin/ai/tools` | GET | List available tools and their schemas |

### 8.3 New Service Files

```
apps/api/src/services/admin_agent/
├── __init__.py
├── agent.py              # Agent setup, executor, streaming
├── tools/
│   ├── __init__.py
│   ├── analytics.py      # Analytics tools
│   ├── database.py       # Database query tools
│   ├── content.py        # Content generation tools
│   ├── actions.py        # Platform action tools
│   └── visualization.py  # Chart/report tools
├── memory.py             # Redis-backed conversation memory
├── schemas.py            # Request/response models
└── callbacks.py          # Streaming + logging callbacks
```

### 8.4 Redis Memory Structure

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `admin_agent_session:{session_uuid}` | String (JSON) | 7 days | Session metadata |
| `admin_agent_history:{session_uuid}` | String (JSON) | 7 days | Full message history |
| `admin_agent_tool_log:{session_uuid}` | List | 7 days | Tool call audit trail |

---

## 9. Security & Guardrails

| Measure | Implementation |
|---|---|
| **Admin-only access** | All endpoints use `require_org_admin()` — regular users cannot access |
| **Read-only DB tools** | Database query tools use `SELECT` only — no `INSERT/UPDATE/DELETE` |
| **Content approval** | Generated content is saved as DRAFT — requires manual approval |
| **Rate limiting** | Per-user + per-org rate limiting (reuse existing `enforce_ai_rate_limit()`) |
| **AI credits** | Admin agent calls consume credits (configurable: 2-5 credits per call) |
| **Audit logging** | Every tool call is logged: user, timestamp, tool name, parameters, result |
| **LLM key isolation** | Admin agent uses its own API key config, separate from student AI chat |
| **SSRF protection** | Any tool that makes external requests uses existing `ssrf_guard.py` |
| **Prompt injection** | System prompt enforces strict boundaries — agent cannot execute arbitrary SQL or shell commands |

---

## 10. Implementation Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Add LangChain dependency
- [ ] Create `admin_agent/` service directory
- [ ] Implement agent setup with configurable LLM provider
- [ ] Implement Redis-backed conversation memory
- [ ] Create SSE streaming for agent responses
- [ ] Add `/admin/ai/chat` endpoint

### Phase 2 — Analytics Tools (Week 3-4)
- [ ] Implement `get_course_analytics()` tool
- [ ] Implement `get_dashboard_metric()` tool
- [ ] Implement `get_course_metric()` tool
- [ ] Implement `export_analytics()` tool
- [ ] Implement `visualize_data()` tool
- [ ] Test analytics queries end-to-end

### Phase 3 — Database Tools (Week 5)
- [ ] Implement `query_users()` tool
- [ ] Implement `query_courses()` tool
- [ ] Implement `query_communities()` tool
- [ ] Implement `query_enrollments()` tool
- [ ] Implement `get_org_stats()` tool

### Phase 4 — Content Generation (Week 6-7)
- [ ] Implement `generate_lesson_content()` tool
- [ ] Implement `generate_course_outline()` tool
- [ ] Implement `generate_knowledge_checks()` tool
- [ ] Implement draft/save workflow
- [ ] Implement content approval flow

### Phase 5 — Platform Actions (Week 8)
- [ ] Implement `create_course()` tool
- [ ] Implement `publish_course()` tool
- [ ] Implement `invite_user()` tool
- [ ] Implement webhook tools
- [ ] Implement notification tools

### Phase 6 — Polish & Admin UI (Week 9-10)
- [ ] Build admin agent chat interface in dashboard
- [ ] Add tool call visualization (show which tools are being called)
- [ ] Add conversation history browser
- [ ] Add audit log viewer for admins
- [ ] Add model provider configuration UI
- [ ] Performance optimization and testing

---

## 11. Admin UI Mockup (Concept)

```
┌─────────────────────────────────────────────────────────┐
│  ● Admin AI Assistant                        [⚙ Settings] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Agent  What's our top course this month?            ││
│  │         ┌─── Tool: get_dashboard_metric ───┐        ││
│  │         │  🔍 Querying analytics...          │        ││
│  │         └────────────────────────────────────┘        ││
│  │                                                       ││
│  │  Koodoox  Your top course is **Advanced React**      ││
│  │           with 234 enrollments (68% completion).      ││
│  │           Want me to generate the lesson content?     ││
│  │                                                       ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │  Suggested actions: [Generate Content] [Analytics]│ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  💬 Ask anything about your platform...              ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 12. Model Provider Configuration

The admin agent supports any LLM provider via a single configuration block:

```yaml
# config.yaml
admin_ai_agent:
  enabled: true
  provider: openai          # gemini | openai | anthropic | ollama
  model: gpt-4o             # or: claude-3-opus, gemini-2.5-pro, llama-3
  api_key: ${ADMIN_AI_API_KEY}
  temperature: 0.3
  max_tokens: 4096
  max_tool_iterations: 10
  credit_cost_per_call: 3
```

Switching providers requires **zero code changes** — just update the config:

```
# From Gemini to Claude:
provider: anthropic
model: claude-3-opus-20240229
api_key: ${ANTHROPIC_API_KEY}

# Or to a local model via Ollama:
provider: ollama
model: llama-3.1-70b
api_key: ""  # not needed
```

---

## 13. Success Metrics

| Metric | Target |
|---|---|
| Admin task completion rate | >80% of queries resolved without human intervention |
| Average response time | <5 seconds for analytics queries |
| Content generation accuracy | >90% of generated content approved without edits |
| Tool call success rate | >95% of tool calls succeed on first attempt |
| Admin adoption | >60% of admins use the agent weekly |

---

## 14. Comparison: Current AI vs. Admin Agent

| Feature | Current AI (Student Chat) | Admin AI Agent |
|---|---|---|
| **Who uses it** | Students | Admins |
| **LLM** | Gemini only (hardcoded) | Any provider (configurable) |
| **Architecture** | Simple prompt → response | Agent loop with tool calling |
| **DB access** | None (context passed manually) | Full read access via tools |
| **Analytics** | None | 40+ queries via tools |
| **Content creation** | Course planning (JSON only) | Full lesson content generation |
| **Actions** | None | Create, publish, invite, notify |
| **Visualizations** | None | Charts and reports |
| **Approval workflow** | None | Draft → approve |
| **Cost** | 1-3 credits | 3-5 credits |

---

## 15. Next Steps

1. ✅ Research completed — architecture validated against existing codebase
2. ⬜ Add LangChain dependency to `pyproject.toml`
3. ⬜ Create `admin_agent/` service module
4. ⬜ Implement Phase 1 (Foundation)
5. ⬜ Implement Phase 2 (Analytics Tools)
6. ⬜ Continue through remaining phases

---

*This document is a living specification and will be updated as implementation progresses.*
