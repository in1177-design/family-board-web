# Family Board: how to build with it

A family daily board for kids and parents: habits (הרגלים) in time windows of the day, and tasks (משימות). **All UI text is Hebrew, right-to-left.** The look is "pixel pastel": cream page, warm-white cards with thin purple pixel borders and a soft offset shadow, turquoise for primary actions and progress, pink for points/accents, 24px Pixelarticons icons.

## Wrap every screen in `FamilyBoardRoot`
It renders `<div class="pl" dir="rtl" lang="he">` with the app font. The stylesheet scopes most rules under `.pl`, so components outside it render unstyled and left-to-right.

```jsx
const { FamilyBoardRoot, PixelCard, PixelButton, StepCard, Blocks } = window.FamilyBoard
<FamilyBoardRoot style={{ background: 'var(--pl-page)', padding: 16 }}>
  <PixelCard className="pl-col" style={{ gap: 12 }}>
    <strong style={{ fontSize: 'var(--pl-size-h3)' }}>בוקר</strong>
    <Blocks percent={60} />
    <PixelButton variant="main">שמור</PixelButton>
  </PixelCard>
</FamilyBoardRoot>
```

## Styling idiom: CSS variables + a few layout classes
Read `styles.css` (it imports `_ds_bundle.css`, the app's real stylesheet) before styling.
- **Colors**: `--pl-page` (cream page), `--pl-card`, `--pl-text`, `--pl-muted`, `--pl-line`, `--pl-accent` (turquoise), `--pl-accent-soft`, `--px-frame` (purple border), `--px-gold`, `--pl-warn`, `--pl-error`.
- **Type**: `--pl-font` (Assistant, everything), `--pl-font-time` (Silkscreen, only for clock times like 07:15, Latin digits only). Sizes: `--pl-size`, `--pl-size-sm`, `--pl-size-h3`, `--pl-size-h2`.
- **Spacing/size**: `--pl-gap`, `--pl-gap-lg`, `--pl-pad`, `--pl-icon-size` (24px), `--pl-page-max` (1200px: max page width on desktop).
- **Layout classes**: `pl-row` (horizontal flex, wraps), `pl-col` (vertical flex), `pl-muted` (secondary text), `pl-chip` (small pill), `pl-name-row` (IconPicker + input in one row), `pl-form-buttons` (Save/Cancel row in a form).
- Use inline `style` with these variables for your own layout glue. Don't invent new colors; don't use rounded "material" cards: use `PixelCard`.

## Components and when to use them
- `PixelButton`: every button. `variant="main"` = primary (Save), `variant="secondary"` = Cancel. Custom colors via `color`/`fill`/`shade`/`text`.
- `PixelCard`: every content box (day windows, "my tasks", summaries). `color`/`bg` for a differently colored card.
- `WindowCard`: a full time-of-day window (`id` morning / noon / evening) with its habits and tasks. `StepCard` = one habit row, `TodoCard` = one task row; both expect the data shapes in their `.d.ts`.
- `Modal`: forms (add/edit habit or task). Bottom sheet on phones.
- `Progress` (thin bar) and `Blocks` (10 pixel blocks, used in the header greeting).
- `Icon` / `IconPicker`: names are in `ICON_NAMES` (e.g. sun, moon, star, heart, clock, backpack, book-open, brush, shirt, apple, bed, home, notebook, sparkles, trophy, calendar).

Design for phone first (≈375px): one column, 16px side padding; on desktop up to 1200px wide with windows side by side.
