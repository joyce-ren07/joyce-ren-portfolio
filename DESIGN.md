# Design tokens

## Type scale (fixed)

These sizes are the source of truth for portfolio and case-study typography.
They are defined as CSS variables in `css/main.css` (`:root`).

| Role | Token | Size |
| --- | --- | --- |
| Title | `--text-title-size` | **64px** |
| Subheading / secondary | `--text-secondary-size` | **32px** |
| Tertiary / body | `--text-tertiary-size` | **16px** |

### Case-study aliases

On `.case-study-page`:

- `--case-title-size` → title (64px)
- `--case-secondary-size` → subheading / secondary (32px)
- `--case-tertiary-size` → tertiary / body (16px)

### Where they apply

- **Title (64px):** section headings, intro titles, page titles (e.g. About, lamp hero name)
- **Secondary (32px):** subheadings (including `.case-subheading` and `.case-subheading--large`)
- **Tertiary / body (16px):** body copy, tertiary body, captions that use the tertiary token

Do not invent new heading sizes for case studies — use these three roles.
