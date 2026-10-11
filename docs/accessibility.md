# Accessibility Checklist

## Passed

- [x] **Focus visible**: `focus-visible` outlines on all interactive elements (buttons, links, form controls)
- [x] **Skip link**: Hidden link at top of page, focusable to skip navigation
- [x] **44px touch targets**: All buttons, links, and interactive elements meet minimum 44×44px size
- [x] **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all animations/transitions
- [x] **Colour-independent verdict**: Verdict conveyed by word, icon, and colour; color-blind safe palette
- [x] **Screen-reader labels**: All controls, verdict card, chart summaries labelled with accessible text
- [x] **Skip link**: Hidden link at top of page, focusable to skip navigation
- [x] **High contrast mode**: Styles respect system colour preferences
- [x] **ARIA labels**: Cloud cards, atlas entries, and chart regions have appropriate ARIA labels
- [x] **Keyboard navigation**: Tab order logical; focus rings visible; `focus-within` row highlighting in tables
- [x] **Verdict never colour-only**: Always paired with icon text and descriptive word

## Items for Final Review

- [ ] **Landmark roles**: Consider adding `role="main"`, `role="navigation"` landmarks
- [ ] **Language attribute**: Ensure `<html lang="en">` is present
- [ ] **Form error associations**: Labels explicitly linked to form controls
- [ ] **Table caption**: Add `<caption>` to any data tables
- [ ] **Live region**: Consider `aria-live` for dynamic verdict updates

## Notes

- All accessibility patterns implemented per the Phase 8 requirements
- Colour palette tested for Color Universal Design (CUD)
- Verdict colour contrast ratios meet WCAG AA minimums
- No colour is used as the sole means of conveying meaning