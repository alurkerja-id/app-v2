# AI Instructions

These instructions apply to all AI assistants working on this project.

## UI Components

- Every new page **must** use **shadcn/ui** components as much as possible.
- The default design system theme is **shadcn Luma**.
- All pages **must** support both **light mode and dark mode**.

## Accent Color

- Every component with an accent color **must** use CSS variable accent tokens from the theme, not hardcoded color values.
- This ensures the appearance automatically adjusts based on the user's selected accent color.
- Use Tailwind classes based on CSS variables such as `bg-accent`, `text-accent-foreground`, `border-accent`, etc. — do not use static colors like `bg-blue-500` or `text-indigo-600` for accent elements.

## Icon Library

- The icon library used is **HugeIcons** (`hugeicons-react`).
- Using other icon sets (Lucide, Heroicons, FontAwesome, etc.) is prohibited.

## Code Quality

- After every code change, **you must run `tsc --noEmit`** to ensure there are no TypeScript errors.
- Do not consider changes complete until `tsc` runs without errors.
