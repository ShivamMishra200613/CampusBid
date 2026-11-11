# Page: Login

Source mockup: `stitch_campusbid_editorial_design_system/campusbid_login/code.html`
Route: `/login`

## Purpose

Sign-in screen restricted to VESIT student emails.

## Layout

- Full-screen centered split card on mustard canvas (`bg-primary-container #F3C348`)
- White card `max-w-[1280px]`, rounded-xl, two halves (stacked on mobile), min-h ~600px

## Left Half — Form (p-8/p-16)

1. Brand wordmark "CampusBid" (Playfair 28px bold)
2. Headline "Welcome back" (Playfair 40px) + subcopy "Log in with your VESIT student email to start bidding."
3. Form (space-y-6):
   - COLLEGE EMAIL label-caps → pill email input, placeholder `name.surname@ves.ac.in`
   - PASSWORD label-caps + right-aligned "Forgot password?" link → pill password input with visibility toggle icon
4. Full-width black pill submit "Log In" (hover → secondary gray)
5. Centered link: "New here? Create an account" → `/register`
6. Small footer links About · Help above hairline divider

## Right Half — Imagery (hidden < md)

Full-bleed editorial collage photo.

## Interactions

- Submit → POST `/api/auth/login` { email, password } (stubbed)
- Password visibility toggle
- Link swap between login/register
