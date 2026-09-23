# Switch

> The Switch component toggles between checked (on) and unchecked (off) states for boolean settings. Built on `@radix-ui/react-switch`, it supports two sizes, a disabled state, and a custom focus ring — and integrates with Formik for form usage.

## Import

```tsx
import { Switch } from "@/components/ui/switch"
```

The component is a thin wrapper around `@radix-ui/react-switch` using `class-variance-authority` (cva) for track and thumb variants. The root `Switch` component composes `SwitchPrimitives.Root` and `SwitchPrimitives.Thumb`.

## Sizes

| Size   | Track (width × height) | Thumb size | Use case                  |
| ------ | ---------------------- | ---------- | ------------------------- |
| `small`| 28×16 (`w-7 h-4`)      | 12px       | Dense forms, inline use   |
| `base` | 32×18 (`w-8 h-[18px]`) | 14px       | Standard form settings    |

**Default size:** `base`

## States

### Unchecked (off)

| Element | Token class               | Visual                       |
| ------- | ------------------------- | ---------------------------- |
| Track   | `bg-ui-bg-switch-off`     | Gray background              |
| Track   | `hover:bg-ui-bg-switch-off-hover` | Slightly darker on hover |
| Thumb   | `bg-white`                | White circle                 |

### Checked (on)

| Element | Token class               | Visual                       |
| ------- | ------------------------- | ---------------------------- |
| Track   | `bg-ui-bg-interactive`    | Indigo background (`#6366f1`)|
| Thumb   | `bg-white`                | White circle, translated right |

### Focus

```tsx
// Applied automatically via Radix focus-visible
```

Focus uses `shadow-details-switch-background-focus` — a subtle indigo ring:

```css
/* Defined in globals.css */
shadow-details-switch-background-focus: 0 0 0 3px rgba(99, 102, 241, 0.2)
```

### Disabled

```tsx
<Switch disabled />
```

| Property          | Value                |
| ----------------- | -------------------- |
| Track opacity     | `opacity-50`         |
| Cursor            | `cursor-not-allowed` |
| Interaction       | Blocked              |

## Usage with labels

Switches are typically paired with a descriptive label in a horizontal layout:

```tsx
<div className="flex items-center justify-between">
  <div>
    <p className="txt-compact-small-plus text-ui-fg-base">Certification</p>
    <p className="txt-small text-ui-fg-subtle">
      Issue a certificate upon course completion
    </p>
  </div>
  <Switch
    checked={certificationEnabled}
    onCheckedChange={setCertificationEnabled}
  />
</div>
```

## Integration with Formik

When used inside a Formik form, the Switch value is managed via Formik's `setFieldValue`:

```tsx
import { useFormikContext } from "formik"

const { values, setFieldValue } = useFormikContext<MyFormValues>()

<Switch
  checked={values.isPublished}
  onCheckedChange={(checked) => setFieldValue("isPublished", checked)}
/>
```

The Switch does not use Form.Control since it's not a standard input element — it communicates state directly through `checked` and `onCheckedChange`.

## Real-world example: Certification toggle

From `EditCourseCertification.tsx`:

```tsx
const [certificationEnabled, setCertificationEnabled] = useState(
  !!course?.certification
)

<Form.Item>
  <div className="flex items-center justify-between">
    <div className="flex flex-col gap-y-1">
      <Form.Label>Certification</Form.Label>
      <span className="txt-small text-ui-fg-subtle">
        Issue a certificate to students who complete the course
      </span>
    </div>
    <Switch
      checked={certificationEnabled}
      onCheckedChange={setCertificationEnabled}
    />
  </div>
</Form.Item>

{certificationEnabled && (
  <div className="mt-4 space-y-4">
    {/* Conditional content: certification fields */}
    <Form.Item>
      <Form.Label>Passing score (%)</Form.Label>
      <Form.Control>
        <Input type="number" placeholder="80" />
      </Form.Control>
    </Form.Item>
  </div>
)}
```

This pattern — a Switch toggling the visibility of a section of form fields — is common throughout the Koodook settings panels.

## Props

| Prop              | Type                     | Default   | Description                              |
| ----------------- | ------------------------ | --------- | ---------------------------------------- |
| `size`            | `"small" \| "base"`      | `"base"`  | Track and thumb dimensions               |
| `checked`         | `boolean`                | —         | Controlled checked state                 |
| `onCheckedChange` | `(checked: boolean) => void` | —      | Change handler                           |
| `disabled`        | `boolean`                | `false`   | Disabled state                           |

All standard Radix `SwitchPrimitives.Root` props are forwarded, including `defaultChecked`, `required`, `name`, and `value`.

## Related components

- **[Input](./input.md)** — Use for text, number, and search input fields.
- **[Button](./button.md)** — Use for form submission actions.
- **[Form](./form.md)** — Form.Item, Form.Label wrappers for consistent layout.
