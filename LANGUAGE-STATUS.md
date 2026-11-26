# Public UI language preview

Implemented on the working branch, not released to production.

## Available
- English (`en`), Bengali-script Bangla with familiar English product/technical terms (`bn`), Hindi (`hi`), Urdu (`ur`). The user clarified that Banglish means Bengali script mixed naturally with English terms, NOT Romanized Bengali. Existing saved `bn` follows that corrected definition.
- Shared persisted setting across exported public pages, cross-tab changes, safe English fallback for invalid settings/blocked storage.
- Homepage hero/helper cards, common navigation/actions, many tool titles and form labels, selected audio/blog controls translated using local curated copy in `assets/language-data.js`.
- Dynamic UI text observed without replacing event-bearing elements. Option values, typed inputs, code/results and published content are protected from translation.
- Urdu document direction and script-specific local fonts, reversible when switching languages.
- A visible “UI languages · Preview” note explains incomplete coverage. Unsupported strings retain their source text (which can still be Bengali on older audio/studio screens).
- Public export injects language assets into public HTML, including generated guides. Admin and advertising iframe are intentionally excluded. Homepage source includes the assets directly; other source HTML gets them at export time.
- Subtle static mint/cream/lavender homepage background; language control restyled.

## Not complete — do not advertise full localization yet
- Many service/marketing paragraphs, consent/legal copy, error/result messages, studio content and guide bodies still need translation.
- Audio/blog legacy Bengali paragraphs/messages need English normalization and three translations. Most dynamic episode metadata and author-supplied text intentionally stays original.
- Translation text needs native-speaker review, especially financial terminology and Urdu layout on real devices.
- No locale-specific URLs, translated SEO metadata, hreflang, automatic article/audio translation, or audience/traffic guarantees.
- Search outside the homepage still primarily matches the original English tool catalog.

## Checks
`npm run build && npm test && npm run test:deployment`

Language tests cover four-way switching, saved/invalid/denied storage, dynamic labels, RTL reversal, submitted option values, inputs/content protection and export coverage. No real-browser visual test has been completed. The local preview serves the rebuilt `public/` directory.
