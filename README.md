# Joyce Ren Portfolio

A simple static portfolio site with a home page and reusable case study template.

## Structure

```
.
├── index.html                      # Home page
├── css/
│   └── main.css                    # Shared styles
├── js/
│   └── main.js                     # Mobile nav toggle
├── assets/
│   └── images/                     # Project images
└── case-studies/
    ├── _template.html              # Copy this to start a new case study
    └── sample-project/
        └── index.html              # Example filled-in case study
```

## Getting started

Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Adding a new case study

1. Copy `case-studies/_template.html` into a new folder, e.g. `case-studies/my-project/index.html`
2. Replace all `[bracketed placeholders]` with your project content
3. Add images to `assets/images/` and swap placeholder divs for `<img>` tags
4. Add a card to the work grid on `index.html` linking to your new case study

## Customization

- Update contact links and bio copy on the home page
- Adjust colors and spacing via CSS variables in `css/main.css`
- Remove the Reflection section from the template if you don't need it
