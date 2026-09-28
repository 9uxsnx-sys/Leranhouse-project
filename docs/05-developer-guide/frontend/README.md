# Frontend Developer Guide

> Technical documentation for the Next.js frontend — architecture, components, contexts, services, state management, and UI library.

---

## Reading Order

Read these documents **in order** to build a complete mental model of the frontend:

```
01  overview.md           → Architecture, App Router structure, Server vs Client Components
02  components.md         → Component hierarchy, naming conventions, directory structure
03  contexts.md           → React Context provider hierarchy, typed hooks
04  services.md           → API service layer, typed fetch wrappers, error handling
05  state-management.md   → SWR server state, useReducer client state, Formik form state
06  ui-components.md      → Medusa UI design system, Radix primitives, component inventory
```

---

## Quick Reference

| File | Covers |
|------|--------|
| [overview.md](./overview.md) | Next.js 16 App Router, `(withmenu)` vs `dash` layouts, Server/Client Component split, key dependencies, build system |
| [components.md](./components.md) | Component directory structure (Dashboard/, Objects/, ui/, Contexts/), naming conventions, prop typing |
| [contexts.md](./contexts.md) | Provider hierarchy (Auth → LHSession → I18n → Org → Course), typed context hooks, provider patterns |
| [services.md](./services.md) | Service modules by domain, auth header injection, error response handling, service function patterns |
| [state-management.md](./state-management.md) | SWR for server state, `useReducer` for editor state, Formik for forms, debounced auto-save pattern |
| [ui-components.md](./ui-components.md) | Medusa UI component inventory, Radix UI primitives, Tailwind v4 styling, accessibility |

---

## Key Concepts

| Concept | Where to Learn More |
|---------|---------------------|
| App Router structure | [overview.md](./overview.md) |
| Component hierarchy | [components.md](./components.md) |
| Context providers | [contexts.md](./contexts.md) |
| API service calls | [services.md](./services.md) |
| State management layers | [state-management.md](./state-management.md) |
| UI design system | [ui-components.md](./ui-components.md) |
| Testing | [testing/README.md](../testing/README.md) |
