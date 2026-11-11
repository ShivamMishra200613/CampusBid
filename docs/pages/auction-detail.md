# Page: Auction Detail

Source mockup: `stitch_campusbid_editorial_design_system/campusbid_product_details/code.html`
Route: `/auctions/:id`

## Purpose
Single auction item view with imagery, seller info, description, bidding panel and bid history.

## Layout
- Sticky top nav (white, hairline bottom border)
- Mustard canvas background; centered white "main stage" card (`max-w-[1280px]`, rounded-2xl, 1px outline border)
- Inner padding 16/40/64px; two-column flex on lg (gap ~80px), stacked on mobile

## Left Column — Imagery
- Hero image: aspect 4/3, rounded-lg, 1px outline border, light-gray bg
- Thumbnail strip below: 4-col grid of square buttons, active = black border, inactive = outline border

## Right Column — Content
1. Category pill badge (gray bg, label-caps, pill)
2. Title: Playfair Display 40px (32px mobile), leading tight
3. Seller row: 40px round avatar + name + green "Verified VESIT Student" check line
4. Description paragraph in `on-surface-variant` brownish gray
5. Condition line: "CONDITION: LIKE NEW" label-caps uppercase
6. Hairline divider
7. Bidding block:
   - "CURRENT HIGHEST BID" label-caps + price in display size (Inter semibold, ₹)
   - Right side: green LIVE pill + countdown "02h : 15m : 45s" with schedule icon
   - Bid form: pill number input (₹ prefix inside, h-14, min = current+increment) + solid-black "PLACE BID" pill button
8. Collapsible `<details>` "BID HISTORY" table: Bidder / Amount / Time rows, avatar-initial circles
9. Secondary "Back to Dashboard" outlined pill button

## Footer
Shared footer component.

## Interactions
- Place bid → POST `/api/auctions/:id/bids` (stubbed)
- Thumbnails switch hero image (state)
