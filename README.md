# Wildstride

A mobile-first **PWA** with an immersive, iOS-style game interface. No Swift, Xcode, native wrapper, or backend is needed.

## Play locally

```sh
npm install
npm start
```

Open **http://localhost:3000**. The game fills the phone viewport; desktop browsers show the same portrait interface. Swipe left/right to change lanes, up to jump rocks, and down to slide under gates. Tap to jump, use the on-screen arrow controls, or use arrow keys / WASD / Space. Escape or P pauses. End a run from the pause screen to bank your rewards.

## Install and play offline

Deploy the root PWA files and `assets/` to an HTTPS static host. On iPhone, open the HTTPS URL in Safari → Share → Add to Home Screen. On supported Android/desktop browsers, use the install option under game Settings or the browser's install control.

The first visit downloads the complete game, including all six artwork assets, for offline use. Wait for loading to finish and for Settings to say **Ready to play offline**. Service workers require HTTPS, except on localhost. A phone opening a computer's plain HTTP LAN address can preview the game but cannot install its offline service worker.

The app uses safe-area insets, dynamic viewport height, portrait standalone display, thumb-accessible controls, native HTML dialog sheets, touch gestures, and reduced-motion preferences. Sound starts only after user interaction. Vibration is used only where supported; iPhone web apps do not provide the same haptic APIs as native apps.

## What you can play

- Three original worlds: Verdant Ruins, Neon District, and Coral Drift.
- Three collectible companions, each with three distinct evolution forms and a special ability.
- Textured perspective tracks, world-specific obstacles, rear-facing runner art, crystal trails, particles, jumps, slides, and increasing speed.
- Companion collection and details, animated evolution, permanent upgrades, pause/resume, and run results.
- Original cinematic world art and transparent creature/prop atlases. Assets are local WebP files; no remote fonts, images, audio, or game runtime is required.

Forest is available immediately. Neon unlocks for 100 energy; ocean for 180. Unlocking a world includes its companion, which can run in any unlocked world. Forest creatures earn extra crystal energy; neon creatures gain longer protection after hits; ocean creatures start with extra health.

Runs grant one bond XP per five meters, minimum one per banked run. Evolution thresholds are 120 and 350 cumulative XP. Crystal magnet and Wild heart upgrades cost 40, 80, then 120 energy and cap at level three. There are no paid upgrades, ads, accounts, or timers.

## Saves and updates

Progress is saved to this browser/device under the existing `wildstride-v1` local-storage key, preserving saves from the original prototype. Sound/tutorial preferences use a separate key. Clearing site data removes progress. Closing an unfinished run loses its unbanked rewards; backgrounding pauses it.

The service worker precaches all game dependencies and serves cached assets offline. Navigation tries the network and falls back to the cached app. Bump the cache version in `sw.js` for a release. A newly activated worker refreshes the app automatically when at camp with no open sheet.

## Tests

```sh
npm test
npx playwright install webkit
npm run test:browser
```

The browser configuration uses an installed Google Chrome channel plus Playwright WebKit. Install Chrome if it is not present.

- **14 unit/cache tests:** save migration, unlock costs, evolution, upgrades, reward banking, runner controls, damage protection, collision rules, safe obstacle lanes, and complete offline asset coverage.
- **8 mobile browser scenarios across Chromium and WebKit:** 390 × 844 and 375 × 667 layouts; sheets and world previews; unlocks, upgrades, both evolutions, companion selection and reload persistence; live rendered gameplay, controls, pause, and banking; offline reload and play with the origin server stopped.

Screenshots and failure traces go under `.artifacts/` (git-ignored). Desktop Safari responsive mode was also inspected visually. Physical iPhone home-screen installation, touch latency, battery use, and hardware performance still need device verification; browser emulation is not a device test.

## Project map

- `index.html`, `style.css`: portrait app shell and responsive UI.
- `app.js`: screens, touch/audio input, progression actions, sheets, and game lifecycle.
- `model.js`: existing progression and persistence rules.
- `runner.js`: testable runner simulation.
- `renderer.js`: canvas rendering, sprite extraction, texture projection, and visual effects.
- `icons.js`: local SVG interface icons.
- `assets/`: bundled artwork; see `assets/ARTWORK.md` for provenance and prompts.
- `sw.js`, `manifest.webmanifest`: PWA installation and offline support.

The earlier Swift experiment is archived under the ignored `.artifacts/native-experiment/` directory and is not part of this app. No commits, pushes, or external deployment were performed.
