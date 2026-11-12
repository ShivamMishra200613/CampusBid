# Placeholder Pages: My Bids / My Listings / Profile

Source mockups: `stitch_campusbid_my_bids`, `stitch_campusbid_my_listings`, `campusbid_profile`
Routes: `/my-bids`, `/my-listings`, `/profile`

## Status

Scaffold-only routes so navbar links resolve. Each renders the shared Navbar/Footer shell with the page title in Playfair Display and an empty-state note ("coming soon" in design language).

## Future Implementation (from mockups)

- **My Listings**: grid of the user's own AuctionCards + status badges (Live/Ended/Sold), edit/delete actions
- **My Bids**: table/cards of auctions bid on — item, your bid, current highest, time left, won/outbid status
- **Profile**: avatar, verified student identity block (name, class, roll no.), stats (active listings, bids placed, wins), account settings form

These pages will consume:

- GET `/api/auctions?seller=me`
- GET `/api/bids/mine` (to be added to contract)
- GET `/api/auth/me`
