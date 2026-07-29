# TimeGrid Product Checklist

## Implemented

- [x] Next.js App Router, TypeScript, Tailwind CSS
- [x] Original TimeGrid branding and UI direction
- [x] Multi-time-zone 24-hour comparison grid
- [x] Default local, New York, London, Tokyo zones
- [x] IANA timezone and DST-aware conversion using `Intl`
- [x] Add cities/time zones from common city list
- [x] Raw IANA timezone add support
- [x] Duplicate prevention
- [x] Reorder and delete rows
- [x] Rename rows
- [x] Set any row as home/base timezone
- [x] Relative timezone offset labels
- [x] Sticky city labels during horizontal scroll
- [x] Current-time indicator
- [x] Date-aware next/previous-day labels
- [x] Working-hours and night highlighting
- [x] Global working hours
- [x] Per-person working hours
- [x] Per-person break/lunch windows
- [x] Fixed/flexible participant toggle
- [x] Avoid weekends scheduling rule
- [x] Overlap quality labels
- [x] Best meeting-time recommendations
- [x] Multi-day recommendations for today, 7 days, and 14 days
- [x] Fairness/pain scoring
- [x] Participant pain map
- [x] Click/drag time selection
- [x] Duration presets
- [x] Copy selected summary
- [x] Copy Slack-friendly summary
- [x] Copy Teams-friendly summary
- [x] Copy share card
- [x] Google Calendar link
- [x] Outlook Calendar link
- [x] `.ics` download
- [x] CSV download for selected time
- [x] Shareable URL state
- [x] URL restore
- [x] LocalStorage preferences
- [x] Team presets in LocalStorage
- [x] Favorites and recent places
- [x] Pin rows
- [x] Sort rows by custom order, name, offset, local time
- [x] 12h/24h time format
- [x] Compact mode
- [x] Dark/light mode
- [x] Keyboard shortcuts: arrows, T, `/`, C
- [x] Command palette
- [x] Natural-language commands for add city, date, duration, time format, weekend rules, and sorting
- [x] Export selected zones as JSON

## In Progress / Next

- [x] Local poll-style availability builder
- [x] Poll share text export
- [x] Anonymous availability marking flow

## Remaining Core Parity

- [x] True multi-day horizontal timeline view
- [x] Timeline zoom modes: 12h, 24h, 3-day, week
- [x] Pin/freeze selected rows independently from sort pinning
- [x] Richer city metadata
- [x] Country flags or region badges
- [x] Week-start preference
- [x] Locale preference

## Collaboration And Sharing

- [ ] Editable collaboration rooms
- [x] Read-only share links
- [x] Poll/voting mode with shareable state
- [x] Anonymous participant availability marking
- [x] Password-protected links
- [x] QR code sharing using a local/private encoder
- [x] Share as PNG
- [x] Export as PDF

## Calendar And Scheduling

- [x] Recurring meeting export
- [x] Recurring `.ics` rules
- [x] Recurring meeting fairness rotation
- [ ] Avoid holidays
- [ ] Calendar availability import
- [ ] Apple Calendar affordances
- [ ] Meeting reminders/alarms in `.ics`
- [ ] Attendee fields in `.ics`

## Power User UX

- [ ] Full keyboard grid navigation
- [ ] Drag handles to resize selected range
- [ ] Undo/redo
- [ ] Natural-language time parsing with timezone phrases
- [ ] Command palette actions for all settings
- [ ] Bulk add zones from pasted text
- [ ] Import zones from JSON/CSV
- [ ] Export all zones as CSV

## Timezone Intelligence

- [ ] DST transition warnings
- [ ] Offset-change badges
- [ ] Ambiguous/nonexistent local time warnings
- [ ] Recurring meeting DST drift warnings
- [ ] Summer/winter offset comparison
- [ ] Sunrise/sunset hints

## Mobile And Accessibility

- [ ] Mobile bottom-sheet add/search
- [ ] Swipe day navigation
- [ ] Tap-and-hold time selection
- [ ] Sticky selected-time summary on mobile
- [ ] WCAG contrast audit
- [ ] Screen-reader grid instructions
- [ ] Reduced-motion mode
- [ ] Color-blind-friendly palette

## Visual And Delight

- [ ] World map mini-view
- [ ] Team pain heatmap
- [ ] Humaneness score explanation
- [ ] Weather-at-meeting-time if a free/private-safe source is chosen
- [ ] Timezone quiz/debug mode
