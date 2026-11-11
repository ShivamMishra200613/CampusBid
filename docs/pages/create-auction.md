# Page: Create Auction (List a New Item)

Source mockup: `stitch_campusbid_editorial_design_system/campusbid_list_a_new_item/code.html`
Route: `/create`

## Purpose
Form to publish a new auction listing.

## Layout
- White stage card on mustard canvas containing its own header/footer (page-level nav inside stage in mockup; we use shared Navbar)
- Content constrained to `max-w-2xl`, centered

## Header
- Centered: "List a New Item" (Playfair 40/32px) + body-md subcopy about detailed info & imagery

## Form Sections (space-y-12)
Each section headed by label-caps uppercase title over a hairline border:

### 1. Image Upload
- Dashed 2px drop-zone, rounded-12px, light bg, camera icon + "Drag & drop or click to upload photos" + "JPG, PNG or WEBP. Max 5MB per image."
- Thumbnail strip: 24x24 rounded-8 tiles with hover remove ×; dashed "+" add tile at end

### 2. Item Details
- TITLE — pill input
- Grid: CATEGORY select · CONDITION select (pill selects with custom chevron)
  - Categories: Electronics, Books, Furniture, Fashion, Sports, Others
  - Conditions: Brand New, Like New, Good, Fair
- DESCRIPTION — textarea rounded-16px (not pill), rows=5, resize-none

### 3. Auction Settings
- Grid: STARTING BID PRICE (₹ prefix) · MIN. BID INCREMENT (₹ prefix) — pill number inputs
- AUCTION DURATION — full-width pill select: 24 Hours / 3 Days / 7 Days

## Actions
- Solid black pill "PUBLISH AUCTION" full width
- Outlined pill "SAVE AS DRAFT" full width

## Interactions
- Publish → POST `/api/auctions` (stubbed), then redirect to `/`
