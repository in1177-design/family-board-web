# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Children, ages 10–13** (two kids in phase 1). They read comfortably, but use the board in short bursts: in the morning before school, after school, and in the evening. Their job: see what is left for today, check it off, and see their points grow.
- **Parents.** Each parent also has their own "My Day". In addition they manage: add and edit habits and tasks for every family member, see each child's day, give points, and change settings. Parent-only screens sit behind a PIN in the client.

## Product Purpose
A family board where each family member sees one personal day built from three separate layers: schedule (read-only, from Google Calendar, not yet built), habits that repeat every day inside a time window (morning, noon, evening), and one-time tasks. Children earn points for what they complete. Success: the kids open the board on their own, know at a glance what is left, and feel satisfaction from what they have already done.

## Positioning
Built for one specific family, around how that family's day actually runs: windows of the day rather than clock times, "school days" rather than Sunday–Thursday (so holidays take care of themselves, and each child has their own school days), and a completed item that stays visible with a line through it, so the child sees what they already did.

## Operating Context
- **Devices today:** mostly phones, plus the parent's computer for management. A shared tablet may come later. Design phone-first (375px), and make sure the desktop (up to 1200px page width) works.
- **Rhythm:** three windows a day. The morning is short and rushed; noon and evening are longer.
- **Language:** Hebrew, RTL, everywhere. The user (a parent and the builder) writes in Hebrew and is addressed in the feminine form.

## Capabilities and Constraints
- Frontend: React 18 + Vite, plain CSS with variables (`src/styles/plain.css`, `theme-pixel.css`), no UI library. Backend: Express on Render, DB on Supabase (separate repo; design work does not touch it).
- **Two designs, chosen per family member** (stored in the DB): **playful** (pastel pixel art) and **refined** (clean). Same structure and components, different skin. Each design has its own avatar per member and its own icon set (Pixelarticons / Lucide, same names).
- Screens: My Day (three windows + "my tasks"), the per-member header (MemberHero) with day progress and points, Home screen (member picker), parent area (overview, calendar, points, settings, habits board, tasks board), profile modal, habit and task forms (modal on desktop, bottom drawer on phone), daily leaderboard, style guide and style lab (parent menu).
- Phase 1 is for one family only. No accounts per member; the parent/child split is a PIN in the client.
- Rules of the work: functionality first, then design. Every structural decision is logged in `docs/family-board/DECISIONS.md` and must not be reopened silently.

## Brand Commitments
- The two designs, their palettes, the avatars (photos for refined, square pixel portraits for playful), the pixel icons and the line icons, and the window illustrations (pixel sun, sunset, moon) are binding. Refinement keeps them; nothing is rebuilt from scratch.
- Fonts: Assistant everywhere; Silkscreen only for times in the playful design (Latin and digits only, never Hebrew).
- UI terms are fixed: "היום שלי", "יומן", "ניקוד", "בוקר / צהריים / ערב", "הרגלים", "משימות".
- Feel: calm in structure, fun in the details.

## Evidence on Hand
- Real family members and their avatars in `src/assets/members/` (the frontend repo is public; do not add personal photos).
- Reference screens for structure only: `docs/family-board/screens/`.
- No testimonials, metrics or external users. Do not invent any.

## Product Principles
1. **What is left today, at a glance.** The child should know in one look what remains and in which window.
2. **Done stays visible.** Completed items stay in place, crossed out, for a sense of accomplishment.
3. **Calm structure, playful details.** Clear hierarchy and few competing colors; delight lives in avatars, icons, progress and points.
4. **One structure, two skins.** Any change works in both designs and keeps them structurally identical.
5. **Phone first.** Touch targets, thumb reach and short visits come before desktop density.

## Accessibility & Inclusion
- Users are children 10–13: comfortable readers, but text should stay short and scannable.
- Touch targets at least 44px (`--pl-touch`). Full RTL correctness. No formal standard was set beyond that.
