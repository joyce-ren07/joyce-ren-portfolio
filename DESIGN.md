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

- **Title (64px):** major section headings (e.g. The Problem, The Solution, Research, Design Process), intro titles, page titles
- **Secondary (32px, weight 500):** section subtitles — e.g. Surveys & Interviews, Social Listening, Market Analysis, Key Insights, Core Design, Constraints & Tradeoffs, Hi-fi Flow Adjustments, User Feedback & Iterations, Clinic-Level Drop-off, Ride Accommodations, Key Takeaways!, What's Next
- **Tertiary / body (16px):** body copy, tertiary body, captions that use the tertiary token

Do not invent new heading sizes for case studies — use these three roles.
