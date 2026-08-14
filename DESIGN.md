# Design tokens

## Type scale (fixed)

These sizes are the source of truth for portfolio and case-study typography.
They are defined as CSS variables in `css/main.css` (`:root`).

| Role | Token | Size | Weight |
| --- | --- | --- | --- |
| Title | `--text-title-size` | **64px** | — |
| Subheading / secondary | `--text-secondary-size` | **32px** | **500** |
| Tertiary / body | `--text-tertiary-size` / `--text-tertiary-weight` | **16px** | **500** |

### Case-study aliases

On `.case-study-page`:

- `--case-title-size` → title (64px)
- `--case-secondary-size` → subheading / secondary (32px)
- `--case-tertiary-size` → tertiary / body (16px)
- `--case-tertiary-weight` → tertiary / body weight (500)

### Where they apply

- **Title (64px):** major section headings (e.g. The Problem, The Solution, Research, Design Process), intro titles, page titles
- **Secondary (32px, weight 500):** section subtitles — e.g. Surveys & Interviews, Social Listening, Market Analysis, Key Insights, Core Design, Constraints & Tradeoffs, Hi-fi Flow Adjustments, User Feedback & Iterations, Clinic-Level Drop-off, Ride Accommodations, Key Takeaways!, What's Next
- **Tertiary / body (16px, weight 500):** body copy, tertiary body (`.case-body--tertiary`), feature-row descriptions, process body, takeaways body, captions that use the tertiary token

## Spacing scale (fixed)

| Role | Token | Size |
| --- | --- | --- |
| Section gap | `--case-section-gap` | **180px** |
| Subsection gap | `--case-subsection-gap` | **120px** |

- **Section gap (180px):** space between sidebar sections (Intro, Problem, Solution, Research, Process, Takeaways) via `.case-block` padding-bottom
- **Subsection gap (120px):** space between subsections within a section (e.g. Surveys & Interviews → Social Listening → Market Analysis; feature rows; process subheads)

Defined on `.case-study-page` in `css/main.css`.
