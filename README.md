# Safa Learns Arabic

A Progressive Web App (PWA) for children to learn Arabic letters through interactive flashcards and audio pronunciation.

## Features

- **Two Learning Modes**
  - **1 Letter**: Single flashcard mode - shows one large Arabic letter, tap to hear pronunciation, auto-loads new letter after tap
  - **Many Letters**: Multiple letters scattered across screen - tap to hear pronunciation and mark as read

- **Audio**: Plays pre-recorded Arabic letter sounds (MP3 files) with TTS fallback if sound unavailable

- **Offline Support**: Full PWA with service worker - works without internet after first load

- **Kid-Friendly UI**: Large Arabic letters in Amiri font, colorful design, simple controls

## How to Run

### Option 1: Node.js Server
```bash
cd safa-reads-arabic
node server.js
```
Open `http://localhost:8000`

### Option 2: Python
```bash
cd safa-reads-arabic/public
python -m http.server 8000
```
Open `http://localhost:8000`

### Option 3: VS Code
- Install "Live Server" extension
- Right-click `public/index.html` → "Open with Live Server"

## Project Structure

```
safa-reads-arabic/
├── public/
│   ├── index.html          # Main HTML
│   ├── manifest.json       # PWA manifest
│   ├── service-worker.js  # Offline caching
│   ├── css/styles.css     # Styles
│   ├── js/
│   │   ├── app.js         # Main app logic
│   │   ├── sound.js       # Audio player with TTS fallback
│   │   └── speech.js      # TTS module
│   ├── data/letters.json  # Arabic letters data (1-29)
│   └── sounds/            # MP3 files (1_alif.mp3 to 29_yaa.mp3)
└── server.js              # Simple Node.js server
```

## Deployment (Netlify)

1. Push code to GitHub
2. Connect repository in Netlify
3. Settings:
   - Build command: (leave empty)
   - Publish directory: `public`
4. Deploy!

## Modes

| Mode | Behavior |
|------|----------|
| 1 Letter | Tap letter → plays sound → loads new letter after 800ms |
| Many Letters | Tap letter → plays sound → marks as read → completion celebration |

## Tech Stack

- Vanilla JavaScript (no frameworks)
- HTML5 Audio API for sound playback
- Web Speech API for TTS fallback
- Service Worker API for offline support
- Amiri font from Google Fonts