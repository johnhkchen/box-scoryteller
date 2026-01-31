# Box Scoryteller - Public Access via Cloudflare Tunnel

## Current Setup
- **Local Dev Server**: http://localhost:5173
- **Cloudflare Tunnel**: Active (any `.trycloudflare.com` domain is allowed)

To get your current tunnel URL, check the cloudflared output when you start it.

Share the tunnel URL with your teammates to give them access to the Box Scoryteller demo.

## What They'll See

The front page showcases the complete Box Scoryteller pipeline:

### System Overview
- Live statistics from the SQLite cache (games processed, parsed, with triggers)
- Real-time data from College of Marin Athletics 2023-24 season

### Interactive Demos (4 Tabs)

1. **Data Pipeline** - Visual 5-stage flow showing raw collection → parsing → validation → signals → triggers
2. **Story Signals** - Rule-based prioritization with top 5 priority games
3. **Narrative Triggers** - LLM-detected story hooks by category
4. **Cache System** - SQLite architecture and API usage examples

### Expandable Game Recaps
In the "Story Signals" tab, click the **+** button on any top priority game to:
- Generate a full game recap using Claude (via BAML)
- See headline, lead paragraph, body content, key stats, and player of the game
- Takes 3-5 seconds to generate on first click (then cached)

## Technical Details

### Tunnel Setup
- Type: Cloudflare Quick Tunnel (trycloudflare.com)
- Protocol: QUIC
- Source: http://localhost:5174
- No authentication required for viewing

### Tunnel Lifespan
- **Quick tunnels have no uptime guarantee** - this is for demo/experimentation
- The tunnel will remain active as long as:
  1. Your local dev server is running (npm run dev)
  2. The cloudflared process is running
- For production use, create a named tunnel with a Cloudflare account

### Restarting the Tunnel
If the tunnel goes down, restart with:
```bash
cloudflared tunnel --url http://localhost:5174
```

The new tunnel URL will be displayed in the output. Update this file and share the new URL.

## What Works
- ✅ Full system overview with live data
- ✅ Interactive tab navigation
- ✅ Story signals prioritization (client-side, instant)
- ✅ Expandable game cards with recap generation
- ✅ LLM-powered recap generation via API
- ✅ Responsive design (mobile-friendly)

## Known Limitations
- Only College of Marin data currently loaded
- Recap generation requires local dev server + BAML + Claude API access
- Quick tunnel URL changes if cloudflared restarts

## Local Development
If teammates want to run locally instead:
```bash
git clone <repo>
npm install
npm run dev
# Visit http://localhost:5174
```

---
Last updated: 2026-01-30
Tunnel started: 2:32 PM PST
