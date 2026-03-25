# AirbnbLens — Design Specification

## Brand

- **Name**: AirbnbLens
- **Tagline**: AI-Powered Style Discovery
- **Values**: Visual, Intuitive, Fast, Precise

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#FF5A5F` | Accent, CTAs, brand |
| `secondary` | `#00A699` | Teal accents |
| `text` | `#222222` | Primary text |
| `background` | `#F7F7F7` | Page background |
| `surface` | `#FFFFFF` | Cards, modals |
| `success` | `#22C55E` | Match scores ≥95% |
| `border` | `#E5E7EB` | Dividers |

## Typography

- **Headings**: Inter (extrabold)
- **Body**: Inter (regular/medium)
- **Sizes**: 8pt grid (12, 14, 16, 20, 24, 32, 48, 64)

## Components

### Header
- Sticky, glassmorphism (`bg-white/95 backdrop-blur-md`)
- Logo + nav + user menu
- Collapses to mini search pill on scroll

### Lens Search Bar
- Rounded pill with two fields: "Where" + "Vibe"
- Red search button with loading spinner
- Dropdown: image upload + preset vibe chips
- Click-outside-to-close

### Category Bar
- Sticky below header
- Scrollable icon row (14 vibe categories)
- Left/right arrow navigation
- Click triggers instant search

### Listing Cards
- Square image (1:1)
- Match score badge (top-left)
- Heart favorite (top-right)
- Style teleport button (top-right, on hover)
- Carousel dots (bottom, on hover)
- Real rating, reviews, beds, baths from data
- Clickable → opens Airbnb listing

### Vibe Map
- Leaflet + OpenStreetMap (free)
- Split-screen: list left, map right (desktop)
- Red dot markers with popup cards
- Highlight on card hover
- Auto-fit bounds to results

### Toast Notifications
- Fixed top-right
- Red error style with icon
- Auto-dismiss after 5 seconds

## Motion

- Page load: `slide-in-from-bottom` (700ms)
- Card hover: `scale(1.02)` (200ms)
- Dropdown: `slide-in-from-top` (200ms)
- Map marker: `scale(1.3)` on highlight

## Responsive

- **Desktop (>1024px)**: Split-screen (list + map)
- **Tablet/Mobile**: Full-width list, map hidden

## Data Flow

```
User Input → Frontend (api.ts) → Backend (main.py)
                                        │
                              ┌─────────┼──────────┐
                              ▼         ▼          ▼
                         ResNet152   ChromaDB   HF LLM
                         (visual)    (text)    (augment)
                              │         │          │
                              └─────────┼──────────┘
                                        ▼
                              Ranked Results → Frontend
```
