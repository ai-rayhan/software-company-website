# ShopSync — Image placement guide

Put each photo at the **exact path** below (JPG). If a file is missing the page shows a designed orange/black
gradient instead, so you can add images one by one — nothing breaks.

**Rules for every image**
- Format: JPG, quality 75–80 (or export WebP and rename the `src` in the HTML). Target **≤ 200 KB** each (hero ≤ 300 KB).
- Sizes below are **2× pixels** so they stay sharp on retina screens. Bigger is fine, smaller looks blurry.
- Photos are cropped to fill (`object-fit: cover`) — keep the main subject **near the centre**, away from edges.
- Style: natural light, real people and real workspaces (laptops, whiteboards, sprint boards). Warm tones match the
  orange brand. Avoid handshake / glowing-brain stock clichés. Your own team photos beat stock every time.
- Text overlays (stats, titles) sit on dark gradient shades, so slightly darker or lower-contrast photos work best there.
- Free stock if needed: Unsplash, Pexels (check the licence). Always write a short, honest `alt` text.

## Home page (`index.html`)
| File (in `assets/images/`) | Pixels | Shape | What to show |
|---|---|---|---|
| `hero/hero-team.jpg` | 1200 × 1400 | portrait | Team collaborating around a laptop/whiteboard. Subject centred; sits behind the dashboard card. |
| `services/web.jpg` | 800 × 500 | 16:10 | Developer at a monitor with a web app |
| `services/mobile.jpg` | 800 × 500 | 16:10 | Hands holding a phone with an app |
| `services/ai.jpg` | 800 × 500 | 16:10 | Data/AI dashboard on screen, server or neural visual |
| `services/design.jpg` | 800 × 500 | 16:10 | Designer with wireframes / Figma |
| `services/cloud.jpg` | 800 × 500 | 16:10 | Server room, cloud ops screens |
| `services/squads.jpg` | 800 × 500 | 16:10 | Engineers pair-programming |
| `team/team-main.jpg` | 900 × 1125 | 4:5 portrait | Whole team or a lead in the office (largest collage photo) |
| `team/team-2.jpg` | 800 × 800 | square | Engineer reviewing code |
| `team/team-3.jpg` | 800 × 800 | square | Designers planning a product |
| `process/process.jpg` | 1200 × 750 | 16:10 | Sprint planning / sticky notes / demo day |
| `results/omniflow.jpg` | 1400 × 1000 | landscape | Fintech / payments visual or client portrait (dark shade is added) |
| `results/medpulse.jpg` | 1400 × 1000 | landscape | Healthcare app in use |
| `results/nexus.jpg` | 1400 × 1000 | landscape | Logistics / airport / cargo |
| `cta/cta-bg.jpg` | 2000 × 900 | wide | Dark, calm office or city-night background (used on every page's big CTA, heavy dark overlay) |

## Services page
| File | Pixels | Shape | What to show |
|---|---|---|---|
| `services/saas.jpg` | 1200 × 1000 | 6:5 | SaaS dashboard on laptop |
| `services/ai-detail.jpg` | 1200 × 1000 | 6:5 | AI assistant / data pipeline |
| `services/mobile-detail.jpg` | 1200 × 1000 | 6:5 | Phones showing the app |
| `services/cloud-detail.jpg` | 1200 × 1000 | 6:5 | Infrastructure / monitoring |

## Case studies page
| File | Pixels | Shape | What to show |
|---|---|---|---|
| `cases/omniflow.jpg` | 1000 × 1200 | portrait | Payments / fintech |
| `cases/vaultai.jpg` | 1000 × 1200 | portrait | Contracts + AI |
| `cases/medpulse.jpg` | 1000 × 1200 | portrait | Telehealth |
| `cases/nexus.jpg` | 1000 × 1200 | portrait | Logistics |

## About page
| File | Pixels | Shape | What to show |
|---|---|---|---|
| `about/office.jpg` | 1200 × 750 | 16:10 | Your office / team at work |
| `about/global.jpg` | 2000 × 900 | wide | World map, city skyline or distributed team (dark band background) |
| `team/sophia-chen.jpg` | 800 × 800 | square | Portrait, face centred, plain/blurred background |
| `team/marcus-vance.jpg` | 800 × 800 | square | Portrait |
| `team/david-miller.jpg` | 800 × 800 | square | Portrait |
| `team/aisha-patel.jpg` | 800 × 800 | square | Portrait |

(Replace those four names/files with your real team; edit the names in `about.html` to match.)

## Contact page
| File | Pixels | Shape | What to show |
|---|---|---|---|
| `contact/support.jpg` | 1200 × 675 | 16:9 | Friendly support/sales person or team |

## Optional: client logos
Marquee logos are text right now. To use real logos, save SVG/PNG (height ≈ 28 px, grey or black) in
`assets/images/logos/` and swap the `<span>` items in the `.h-logos` strip of `index.html` for `<img>` tags.

## Not images
The hero dashboard, goal animations, and integration diagram are built with CSS/SVG on purpose — they stay crisp and
animate, so don't replace them with screenshots.
