# Page: Register (Sign Up)

Source mockup: `stitch_campusbid_editorial_design_system/campusbid_sign_up/code.html`
Route: `/register`

## Purpose

Create a VESIT student account (@ves.ac.in only).

## Layout

- Split card on mustard canvas, `max-w-[1280px]`, rounded-16px, min-h 800px
- Left half has vertical hairline border separating it from the photo bento

## Left Half — Form (max-w-md, p up to 20)

1. "← BACK TO LOGIN" label-caps link with arrow icon
2. Display headline "Join CampusBid" (Playfair 64/32px) + body-lg subcopy
3. Form fields (labels = label-caps uppercase; inputs = `.editorial-input` pills):
   - FULL NAME — text
   - VESIT EMAIL — email, hint under field "Only @ves.ac.in emails are accepted."
   - Grid: CLASS/BRANCH (e.g. D12C) · ROLL NO.
   - Grid: PASSWORD · CONFIRM PASSWORD (both with visibility toggles)
4. Terms checkbox: agree to Community Guidelines + Terms of Service
5. Full-width black pill submit "CREATE ACCOUNT →"
6. Divider + "Already have an account? Log in here"

## Right Half — Curated Collections Bento

- Header "Curated Collections" (Playfair 28px) + subcopy
- 2-col × 3-row bento grid:
  - Tall tile (2 rows): Advanced Mathematics Vol II — tag ACADEMIC
  - Square tile: Casio fx-991EX — tag TOOLS
  - Square tile: Sony WH-1000XM4 — tag ELECTRONICS
  - Wide tile (2 cols): VESIT Official Merchandise — tag FASHION + "Featured"
- Tiles: rounded-xl, 1px border, gradient overlay, category pill top-left of caption, hover scale image

## Background

Subtle fixed gradients (primary-fixed / surface-tint at low opacity) over canvas.

## Interactions

- Submit → POST `/api/auth/register` { fullName, email, classBranch, rollNo, password } (stubbed)
