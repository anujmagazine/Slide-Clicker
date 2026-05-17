# Slide Clicker

**Turn your phone into a wireless presentation clicker — zero install, zero friction.**

Your presentation runs on your laptop. Your phone becomes the remote. Scan a QR code, tap to advance slides. That's it.

Built entirely with AI — because we practice what we preach.

---

## Quick Start

Choose the option that matches you:

---

### Option A — Double-Click to Launch (easiest, Node.js required)

> Best for non-technical users who just want to run it with no commands.

1. Download or clone this repo
2. Double-click **`Start Slide Clicker.bat`**
3. Your browser opens automatically with the QR code
4. Scan it with your phone — done

The `.bat` file handles everything: checks for Node.js, installs packages on first run, starts the server, and opens your browser. You never need to touch a terminal.

> **Don't have Node.js?** The batch file will detect this and send you to [nodejs.org](https://nodejs.org) to download it. Install it (keep all defaults), then double-click the `.bat` file again. One-time setup only.

---

### Option B — Standalone .exe (zero prerequisites)

> Best for sharing with others who may not have Node.js at all.

Coming soon — see the [Building a Standalone .exe](#building-a-standalone-exe) section below to build it yourself.

---

### Option C — Command Line (for developers)

```bash
npm install
npm start
```

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

1. Start the app (double-click `Start Slide Clicker.bat` or run `npm start`)
2. Your browser opens automatically with a QR code
3. Open your presentation in slideshow mode
4. Scan the QR code with your phone
5. Your phone is now a wireless clicker with a laser pointer

**No app to install on the phone. No Bluetooth. No pairing. No drivers. Just a browser.**

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

### Non-technical users (no commands needed)

1. Download and unzip this repo
2. Double-click **`Start Slide Clicker.bat`**
3. If prompted about Node.js, go to [nodejs.org](https://nodejs.org), install it, then double-click again
4. Your browser opens automatically — you'll see the QR code
5. Open your presentation in slideshow mode
6. Scan the QR code with your phone and start presenting

### Developers

```bash
git clone https://github.com/anujmagazine/Slide-Clicker.git
cd Slide-Clicker
npm install
npm start
```

The server starts and your browser opens automatically to `http://localhost:3000`.

```
  ╔══════════════════════════════════════════╗
  ║         SLIDE CLICKER — Ready!           ║
  ╠══════════════════════════════════════════╣
  ║  Laptop:  http://localhost:3000          ║
  ║  Phone:   http://192.168.x.x:3000/remote║
  ╚══════════════════════════════════════════╝
```

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

## Presenting at a Company or Conference Venue

This is the most important thing to know before you present somewhere new.

Most corporate offices, hotels, and conference venues use **client isolation** on their WiFi — a security setting that prevents devices on the same network from talking to each other. Your phone and laptop can both be connected to the same WiFi, but they still can't reach each other. This is why you might see a **"Page cannot be displayed"** error on your phone even though the QR code looks correct.

There are two reliable ways to get around this.

---

### Option 1 — Use Your Phone as a Hotspot (Recommended)

Turn your phone into its own private WiFi network and connect your laptop to it. This completely bypasses the venue's network — your phone and laptop are on their own isolated connection that no IT policy can block.

**On iPhone:** Settings → Personal Hotspot → turn on

**On Android:** Settings → Hotspot & Tethering → Mobile Hotspot → turn on

Then on your laptop, disconnect from the venue WiFi and connect to your phone's hotspot instead. Run `npm start` as normal. The QR code will show your laptop's IP on the hotspot network and your phone will connect instantly.

✅ No internet required on laptop
✅ Works at any venue, any company, any country
✅ No accounts, no setup, just flip a switch
✅ The go-to option for presentations

---

### Option 2 — Use ngrok (When Your Laptop Needs Internet Too)

ngrok is a free tool that creates a temporary public URL pointing to your laptop. Instead of your phone connecting directly to your laptop's IP (which gets blocked), it connects through ngrok's servers on the internet — which are never blocked.

Think of it like this: your laptop is a shop with no street address. ngrok gives it a real public address and forwards all deliveries to you, even though you're hidden behind a corporate firewall.

**One-time setup:**

```bash
npm install -g ngrok
```

Sign up free at [ngrok.com](https://ngrok.com), then run:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

**Every time you present:**

Open two terminals side by side.

Terminal 1:
```bash
npm start
```

Terminal 2:
```bash
ngrok http 3000
```

ngrok gives you a public URL like `https://abc123.ngrok.io` — your phone opens that instead of the local IP, and it works from anywhere.

✅ Works even if phone and laptop are on completely different networks
✅ No need to disconnect laptop from venue WiFi

⚠️ Requires your laptop to have internet access
⚠️ The public URL changes every time you restart ngrok (free plan)

---

### Which one should you use?

| Situation | Best option |
|-----------|-------------|
| Presenting at a corporate office or hotel | **Phone hotspot** |
| You need your laptop on the venue internet | **ngrok** |
| Your own office or home network | App works as-is, no workaround needed |

**Default habit:** always use your phone hotspot before a presentation. It takes 10 seconds and will never fail you.

---

## Troubleshooting

### Phone shows "Page cannot be displayed"
- This is almost always a **client isolation** issue on the venue WiFi — see the section above
- Fix: switch your laptop to your phone's hotspot, or use ngrok

### Phone can't connect
- Make sure your laptop and phone are on the **same WiFi network** (or laptop is on phone hotspot)
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
- **Same network required** — phone and laptop must be on the same WiFi. Corporate/hotel networks often block device-to-device communication — use phone hotspot or ngrok as a workaround (see above)
- **Primary monitor only** — the laser overlay renders on the primary display
- **No presentation file management** — this is a pure remote control, not a slide viewer. Your presentation runs in whatever app you normally use

---

## Building a Standalone .exe

If you want to share Slide Clicker with someone who doesn't have Node.js, you can package it into a single `.exe` file they just double-click. Nothing else needed on their machine.

**One-time setup:**

```bash
npm install
npm install -g pkg
```

**Build the exe:**

```bash
npm run build
```

This creates `dist/SlideClicker.exe`. Send that file to anyone — they double-click it, their browser opens automatically, done.

> **Note:** The first time you run the exe on a new machine, Windows may show a security warning ("Windows protected your PC"). Click **More info** → **Run anyway**. This happens because the exe is not signed with a paid certificate — it's safe.

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
