# Transform littlewins into an editorial public wall

## Goal
Make the wall feel bright, accumulated, and worth lingering over: expressive anonymous voices arranged organically, without resembling cards, stationery, or a marketed product.

## Visual direction
- Use the selected **Editorial typography masonry** direction as the compositional reference, while removing its dark tile, large rounded cards, shadows, orange accents, and decorative labels.
- Shift the page to a near-white neutral background with charcoal text and a small set of extremely pale, low-saturation surface tints.
- Keep `littlewins` quiet and place-like, with a compact header and understated count/date context so the wall begins near the top.
- Set each win in a readable expressive serif; keep times, language controls, and actions in a clean sans-serif.

## Wall composition
- Replace the repeated paper-slip treatment with borderless typographic entries and occasional softly tinted fields.
- Build a coherent 3/2/1-column editorial masonry flow for desktop, tablet, and mobile.
- Introduce restrained variation based on content length and position: type scale, whitespace, alignment, and surface treatment will differ without compromising reading order.
- Remove pins, decorative shadows, uniform borders, and identical spacing.
- Preserve newest-first ordering and all existing mock wins.

## Interaction
- Keep one simple “+ My little win” action, the EN/FR switch, and the existing anonymous submission flow.
- Restyle the submission dialog to match the bright editorial wall rather than a paper card.
- Give new and existing wins a subtle settling motion; use quiet color/opacity feedback instead of card lift, rotation, or bounce.
- Preserve reduced-motion behavior.

## Content and responsive verification
- Preserve current bilingual copy and localization behavior unless a label needs a small tonal adjustment.
- Verify desktop, tablet, and mobile for natural masonry balance, comfortable serif reading, no overlap or overflow, and a strong single-column mobile rhythm.
- Confirm language switching, one submission action, dialog behavior, newly submitted win placement, newest-first order, and absence of browser errors.

## Technical details
- Update the page presentation and global semantic design tokens/utilities only; retain the current mock-data model and functionality.
- Load any new editorial font through the existing document font links, not CSS imports.
- No backend, authentication, likes, comments, profiles, analytics, or social features.
