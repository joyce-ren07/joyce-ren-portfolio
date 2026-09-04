# AutoInvent portfolio — visual rules

All portfolio figures must use `autoinvent-portfolio.css`. Import it once, then use
the tokens and classes below. Never introduce colors, fonts, or radii not defined there.

## Non-negotiables
- Page background is always `--page-bg` (#EAE8E4, warm grey). Cards are `--card-bg` (#FAF9F7).
- Type is `--font` (Rethink Sans, falling back to the system sans-serif stack). Keep all text in the shared title, secondary, or tertiary roles.
- Orange `--accent` (#F0774C) is the only accent. Use it for eyebrows, number badges,
  card top-rules, and card titles when a card is a "principle". Never as a large background fill.
- No gradients, no drop shadows, no emoji, no decorative icons.
- Borders are hairline: `1px solid var(--line)`. Radius is `--r-md` (14px) for cards,
  `--r-pill` for badges and buttons.

## Figure anatomy
Every figure is 1200px wide, 64px padding, and follows:

```html
<div class="figure">
  <div class="eyebrow">Section name</div>
  <div class="headline">One-sentence claim, sentence case.</div>
  <div class="grid-3">
    <div class="card card--accent">
      <div class="numeral">1</div>
      <div class="card__title">Short title</div>
      <div class="card__body">One or two sentences, max ~20 words.</div>
    </div>
    <!-- 2-3 more cards -->
  </div>
</div>
```

## Content rules
- 3 cards is the default. 4 max. Never 5+ — split into two figures instead.
- Card titles: 2-5 words. Card body: one sentence, tightened.
- Headline states a claim, not a label ("Three rules I held every decision against."),
  and the eyebrow carries the label ("Design principles").
- Only use arrows / connectors when the content is genuinely sequential. Parallel
  concepts get equal cards with no connectors.
- Use `.band` (dashed orange tint) for something that spans or qualifies all the cards.

## Spacing
- 8px between eyebrow and headline; 40px from headline to the card grid; 16px card gap.
- Inside a card: 14px between elements.
