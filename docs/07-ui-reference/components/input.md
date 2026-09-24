# Input & Textarea

> Input and Textarea capture text input from users. They share the same Medusa design tokens, sizing, and styling — with the Input also supporting a search variant that includes a magnifying-glass icon overlay.

## Import

```tsx
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
```

Both components are built as simple React `forwardRef` components wrapping native `<input>` and `<textarea>` elements. They apply Medusa token classes directly and accept all standard HTML attributes.

## Input

### States

#### Default (empty)

```tsx
<Input placeholder="Course title" />
```

| Token class               | Purpose                    |
| ------------------------- | -------------------------- |
| `bg-ui-bg-field`          | Background (`#fafafa`)     |
| `shadow-borders-base`     | 1px border                 |
| `txt-small`               | 13px text                  |
| `placeholder:text-ui-fg-muted` | Placeholder color     |
| `caret-ui-fg-base`        | Caret color                |

#### Focus

```tsx
// Focus state is automatic via browser :focus
```

| Token class                                | Purpose                    |
| ------------------------------------------ | -------------------------- |
| `shadow-borders-interactive-with-active`   | Indigo border glow         |
| `bg-ui-bg-field`                           | Unchanged background       |

#### Hover

```tsx
// Automatic via :hover pseudo-class
```

| Token class                | Purpose                |
| -------------------------- | ---------------------- |
| `bg-ui-bg-field-hover`     | Slightly darker field  |

#### Error

```tsx
<Input aria-invalid="true" />
```

Error state is triggered by `aria-invalid="true"` or the native `:invalid` pseudo-class:

```css
/* Applied via CSS selector in the component */
aria-[invalid="true"]:!shadow-borders-error
invalid:!shadow-borders-error
```

This renders the red `shadow-borders-error` token (`inset 0 0 0 1px #e11d48, 0 0 0 1px #e11d48`).

#### Disabled

```tsx
<Input disabled />
```

| Token class                  | Purpose                      |
| ---------------------------- | ---------------------------- |
| `bg-ui-bg-disabled`          | Muted background             |
| `text-ui-fg-disabled`        | Muted text                   |
| `pointer-events-none`        | Blocks interaction           |

### Search Input

The search variant renders a text input styled with a search icon overlay. It is triggered by passing `type="search"`:

```tsx
<Input type="search" placeholder="Search courses…" />
```

| Property            | Value    | Purpose                         |
| ------------------- | -------- | ------------------------------- |
| Icon                | Search   | Magnifying glass from lucide-react (16×16) |
| Icon position       | Left     | Absolutely positioned, `left-2` |
| Text padding        | `pl-8`   | Prevents text under icon        |
| Icon color          | `text-ui-fg-muted` | Subtle gray             |
| Cancel button       | `hidden` | Native search cancel button hidden via `[&::-webkit-search-cancel-button]:hidden` |

The icon is rendered inline:

```tsx
{type === "search" && (
  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-ui-fg-muted pointer-events-none">
    <Search className="h-4 w-4" />
  </div>
)}
```

### Sizes

| Size   | Height | Text style | Icon offset (search) |
| ------ | ------ | ---------- | -------------------- |
| `base` | `h-8`  | `txt-small`| `pl-8`               |
| `small`| `h-7`  | `txt-small`| `pl-7`               |

## Textarea

Textarea shares the same styling as Input — same background, border, hover, focus, error, and disabled token classes. The key differences are:

| Property    | Input          | Textarea               |
| ----------- | -------------- | ---------------------- |
| Element     | `<input>`      | `<textarea>`           |
| Min height  | `h-8` (fixed)  | `min-h-[60px]`         |
| Resize      | N/A            | `resize-y` (vertical)  |
| Text style  | `txt-small`    | `txt-small`            |
| Padding     | `px-2`         | `px-2 py-1.5`          |

```tsx
<Textarea placeholder="Course description…" rows={4} />
```

## Form.Control and Form.Item

Input and Textarea are typically used inside **Form.Control** and **Form.Item** wrappers for consistent layout, labels, and error messages.

### Form.Item structure

```tsx
<Form.Item>
  <Form.Label>Course Title</Form.Label>
  <Form.Control>
    <Input placeholder="Enter course title" />
  </Form.Control>
  <Form.Hint variant="info">Visible to enrolled students</Form.Hint>
  <Form.ErrorMessage />
</Form.Item>
```

### Form.Control `asChild` warning

Form.Control renders a **plain `<div>`** element. When you pass an `<input>` as its child, React issues a `setCustomValidity` warning because `<div>` elements don't support form validation methods.

```
Warning: Failed prop type: Invalid prop `onInvalid` supplied to `forwardRef(FormControl)`
```

This warning is harmless. The form validation still works correctly through the native `<input>` element. To suppress the warning, you can skip Form.Control and render the Input directly inside Form.Item:

```tsx
<Form.Item>
  <Form.Label>Course Title</Form.Label>
  <Input placeholder="Enter course title" />
  <Form.ErrorMessage />
</Form.Item>
```

### Hint component

The Hint component (`@/components/ui/hint`) supports two variants:

| Variant | Visual style                                      |
| ------- | ------------------------------------------------- |
| `info`  | `text-ui-fg-subtle` (gray)                        |
| `error` | `text-ui-fg-error` (red) with icon grid layout    |

```tsx
<Form.Hint variant="info">This will appear on the course page</Form.Hint>
<Form.Hint variant="error">Course title is required</Form.Hint>
```

## Real-world example: LessonDetailForm

```tsx
import { Formik, Form, Field } from "formik"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

<Formik
  initialValues={{ name: lesson.name, description: lesson.description }}
  onSubmit={handleSubmit}
>
  {({ values }) => (
    <Form className="flex flex-col gap-y-6">
      <Form.Item>
        <Form.Label>Lesson Name</Form.Label>
        <Form.Control>
          <Field name="name" as={Input} placeholder="Lesson name" />
        </Form.Control>
        <Form.ErrorMessage name="name" />
      </Form.Item>

      <Form.Item>
        <Form.Label>Description</Form.Label>
        <Form.Control>
          <Field name="description" as={Textarea} placeholder="Lesson description" rows={3} />
        </Form.Control>
        <Form.Hint variant="info">
          A brief summary that helps students understand what this lesson covers.
        </Form.Hint>
        <Form.ErrorMessage name="description" />
      </Form.Item>
    </Form>
  )}
</Formik>
```

## Props

### Input

| Prop          | Type                        | Default   | Description                          |
| ------------- | --------------------------- | --------- | ------------------------------------ |
| `size`        | `"base" \| "small"`         | `"base"`  | Input height                         |
| `type`        | `"text" \| "search" \| …`   | `"text"`  | `"search"` renders icon overlay      |
| `placeholder` | `string`                    | —         | Placeholder text                     |
| `disabled`    | `boolean`                   | —         | Disabled state                       |
| `aria-invalid`| `boolean`                   | —         | Error state (red border)             |

All native `<input>` attributes are forwarded.

### Textarea

| Prop          | Type      | Default | Description                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `placeholder` | `string`  | —       | Placeholder text                     |
| `rows`        | `number`  | —       | Visible number of rows               |
| `disabled`    | `boolean` | —       | Disabled state                       |
| `aria-invalid`| `boolean` | —       | Error state (red border)             |

All native `<textarea>` attributes are forwarded.

## Related components

- **[Switch](./switch.md)** — Alternative for boolean toggles instead of checkbox inputs.
- **[Button](./button.md)** — Submit button that pairs with Input fields in forms.
