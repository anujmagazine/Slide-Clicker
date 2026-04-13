# Slide Clicker

**Turn your phone into a wireless presentation clicker — zero install, zero friction.**

Your presentation runs on your laptop. Your phone becomes the remote. Scan a QR code, tap to advance slides. That's it.

Built entirely with AI — because we practice what we preach.

---

## The Problem

If you've ever presented at a bootcamp, workshop, or conference, you've hit at least one of these:

- **Forgot the clicker** — you're standing in front of 50 people and realize your Logitech is sitting on your desk at home
- **Dead batteries** — the clicker worked during rehearsal but dies mid-presentation
- **Bluetooth pairing issues** — you're fumbling with settings while your audience watches
- **Borrowed laptop** — you're presenting on someone else's machine and your clicker doesn't pair with it
- **No pointing device** — cheap clickers don't have a laser pointer, and the ones that do cost $50+
- **Stuck at the laptop** — without a clicker you're chained to the keyboard, pressing arrow keys like it's 2005
- **Setup anxiety** — you waste the first 5 minutes of your session installing drivers or pairing devices instead of teaching
- **Multiple presenters** — passing a physical clicker between co-facilitators is awkward and error-prone

Slide Clicker solves all of these with **one thing everyone already has — a phone**.

---

## How It Works

```
┌──────────────┐     WiFi (same network)     ┌──────────────┐
│              │◄────── WebSocket ───────────►│              │
│    LAPTOP    │                              │    PHONE     │
│  (presents)  │   QR code ──► scan ──► open  │  (controls)  │
│              │                              │              │
│  PowerPoint  │◄── Right/Left arrow keys ───│  Tap Next /  │
│ Google Slides│                              │  Previous    │
│  Keynote     │◄── Laser pointer coords ────│  Touch drag  │
│  PDF viewer  │                              │  on trackpad │
│  Any app     │                              │              │
└──────────────┘                              └──────────────┘
```

1. Run `npm start` on your laptop
2. Open your presentation in slideshow mode
3. Scan the QR code with your phone
4. Your phone is now a wireless clicker with a laser pointer

**No app to install. No Bluetooth. No pairing. No drivers. Just a browser.**

---

## Features

### Slide Navigation
- **Next / Previous** buttons with large touch targets designed for one-handed use
- **Haptic feedback** — subtle vibration on tap (on supported phones)
- **Ripple animation** — visual confirmation of every tap
- Works with **any presentation app** — PowerPoint, Google Slides, Keynote, LibreOffice Impress, PDF viewers, anything that uses arrow keys

### Laser Pointer
- **Touchpad on your phone** — touch and drag to move a red laser dot on your laptop screen
- **Glowing red dot** with soft radial glow — visible on any background
- **Transparent overlay** — sits on top of your presentation, click-through so nothing is blocked
- **Lift to hide** — dot disappears the moment you lift your finger
- Switch between Slides mode and Laser mode with a single tap

### Zero Friction
- **QR code** auto-generated on the laptop screen — scan and you're connected
- **No install** on the phone — it's a web page
- **No pairing** — works over your existing WiFi network
- **Auto-reconnect** — if connection drops, the phone reconnects automatically
- **Multiple remotes** — more than one phone can connect (great for co-presenters)

### Elegant Design
- Dark theme optimized for stage lighting
- Minimal UI — nothing to distract you while presenting
- Connection status indicator so you always know you're linked
- Safe-area aware — works perfectly on phones with notches / dynamic islands

---

## Prerequisites

- **Node.js** (v16 or later) — [download here](https://nodejs.org/)
- **Windows 10/11** — the keystroke injection and laser overlay use PowerShell + WinForms
- **WiFi** — your laptop and phone must be on the same network

---

## Setup

### Step 1: Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/slide-clicker.git
cd slide-clicker
```

### Step 2: Install dependencies

```bash
npm install
```

That's it. Three dependencies: `express`, `ws`, `qrcode`. No build step. No bundler. No config files.

### Step 3: Start the server

```bash
npm start
```

You'll see:

```
  ╔══════════════════════════════════════════╗
  ║         SLIDE CLICKER — Ready!           ║
  ╠══════════════════════════════════════════╣
  ║  Laptop:  http://localhost:3000          ║
  ║  Phone:   http://192.168.x.x:3000/remote║
  ╚══════════════════════════════════════════╝

  Open your presentation, then scan the QR code with your phone.
```

### Step 4: Open the presenter page

Go to `http://localhost:3000` in your laptop browser. You'll see a QR code.

### Step 5: Scan with your phone

Open your phone camera (or any QR scanner) and scan the code. A web page opens — that's your clicker. No app store. No download. Just works.

### Step 6: Present

Open your presentation in slideshow mode. Start tapping.

---

## Usage

### Slides Mode (default)

| Action | What happens |
|--------|-------------|
| Tap **Next Slide** (big button) | Sends → Right Arrow to your laptop |
| Tap **Previous** (smaller button) | Sends ← Left Arrow to your laptop |

### Laser Mode

| Action | What happens |
|--------|-------------|
| Tap **Laser** tab | Activates transparent overlay on laptop screen |
| **Touch & drag** on trackpad | Red laser dot follows your finger |
| **Lift finger** | Dot disappears |
| Tap **Next / Prev** buttons below trackpad | Navigate slides while in laser mode |
| Tap **Slides** tab | Deactivates laser, returns to full clicker view |

---

## Project Structure

```
slide-clicker/
├── server.js          # Express + WebSocket server, keystroke injection, overlay management
├── overlay.ps1        # PowerShell script — transparent laser pointer overlay (C#/WinForms)
├── package.json
└── public/
    ├── index.html     # Laptop page — QR code, connection status
    └── remote.html    # Phone page — clicker UI, laser trackpad
```

---

## How the Tech Works

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Server | Node.js + Express | Serves pages, coordinates communication |
| Real-time | WebSocket (`ws`) | Near-instant message relay between phone and laptop |
| QR Code | `qrcode` npm package | Auto-generates scannable link to the phone remote |
| Keystroke injection | PowerShell + `System.Windows.Forms.SendKeys` | Sends arrow keys to the foreground app |
| Laser overlay | PowerShell + C# WinForms | Transparent, topmost, click-through window with painted dot |
| Phone UI | Vanilla HTML/CSS/JS | No framework — fast load, works on any mobile browser |

---

## Troubleshooting

### Phone can't connect
- Make sure your laptop and phone are on the **same WiFi network**
- Check if your laptop firewall is blocking port `3000` — add an inbound rule to allow it
- Try typing the URL manually: `http://<your-laptop-ip>:3000/remote`

### Slides don't advance
- Make sure your presentation is in **slideshow mode** and is the **foreground window** on your laptop
- The server sends Right/Left arrow keys — this works with PowerPoint, Google Slides (in present mode), Keynote, and most PDF viewers

### Laser pointer doesn't appear
- The overlay is Windows-only (uses WinForms)
- Make sure PowerShell execution policy allows scripts — the server runs with `-ExecutionPolicy Bypass`
- The overlay sits on top of all windows — if your presentation is on a secondary monitor, the dot appears on the primary monitor

### Port 3000 is in use
- Change the `PORT` variable at the top of `server.js`

---

## Limitations

- **Windows only** — keystroke injection uses PowerShell `SendKeys`, laser overlay uses WinForms. macOS/Linux support would need a different approach (e.g., `xdotool` on Linux, `osascript` on macOS)
- **Same network required** — phone and laptop must be on the same WiFi. Won't work over mobile data
- **Primary monitor only** — the laser overlay renders on the primary display
- **No presentation file management** — this is a pure remote control, not a slide viewer. Your presentation runs in whatever app you normally use

---

## Roadmap

- [ ] Timer / stopwatch visible on phone for pacing
- [ ] Black screen toggle (blank the projector with one tap)
- [ ] Slide counter (Slide 12 of 34)
- [ ] Speaker notes on phone
- [ ] macOS support via `osascript`
- [ ] Linux support via `xdotool`

---

## License

MIT — use it, fork it, present with it.

---

**Built with AI. Because we practice what we preach.**
