# Page: Home Dashboard

Source mockup: `stitch_campusbid_editorial_design_system/campusbid_home_dashboard/code.html`
Route: `/`

## Purpose

Landing page for CampusBid. Shows the editorial hero, category filters, and the live auction grid for the VESIT student marketplace.

## Layout

- Fixed top navigation bar (glass blur over mustard canvas)
- White "main stage" panel, `max-w-[1280px]`, rounded-16px, 48px padding, centered on mustard background
- On mobile (<768px): canvas disappears, stage becomes full-bleed with 24px/16px padding

## Sections (top to bottom)

### 1. Hero

- Full-width rounded-xl block, `min-h-[500px]`, background collage image (opacity 80%)
- Centered display headline: "THE SENSE OF AUCTION" — Playfair Display, 64px, weight 800, uppercase, black
- Overlay white card pinned bottom-center (`max-w-4xl`): "Built with intent" label-caps divider line ornament, body-md description paragraph, row of 4 square thumbnails (24x24, 1px border)

### 2. Category Filter Bar

- Centered horizontal label-caps links: All (8) · Electronics (4) · Books (5) · Furniture (2) · Fashion (7) · Sports (3) · Others (1)
- Active item: black text + black underline; others gray, hover to black
- Section has bottom hairline border

### 3. Auction Grid

- Responsive grid: 1 col mobile / 2 col md / 4 col lg, gap-x-6 gap-y-12
- Each card = `AuctionCard` component:
  - Square image area, light-gray placeholder bg, 1px outline border, 12px radius
  - Status badge top-left (pill): "Live" green #4CAF50 or "Ended" gray #807663
  - Item name top-right in body-sm
  - Hover: image scales 105%, "Bid Now"/"View" pill button fades in bottom-right
  - Metadata rows below image separated by hairlines: SELLER / value, CONDITION / value, CURRENT BID (label-caps left, price-display right)
  - Prices use ₹ and Inter 20px semibold

### 4. Info Banner

- Full-width black band, two halves:
  - Left: label-caps kicker "— ROOTED IN FORM", display-lg uppercase "PERS—PECTIVE", auction schedule copy (body-sm gray)
  - Right: textured image half with giant "15%" display figure + buyer premium note, floating white pill badge "Now Accepting Reservations!" with avatar cluster

## Data

Cards render from `src/data/auctions.js` sample array until API is wired.

## Interactions

- Card click → navigate to `/auctions/:id`
- "+ Add Product" navbar button → `/create`
- Category filter → client-side filter (visual only at scaffold stage)
