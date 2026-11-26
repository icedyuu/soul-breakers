# SOUL BREAKERS — 魂砕き

Anime fighting game in the browser (HTML5 Canvas + JavaScript, no engine). 19 chibi fighters, 1P vs CPU, local 2P, Training — and **ONLINE 1 VS 1** between two phones or PCs.

**Play:** https://icedyuu.github.io/soul-breakers/

On a phone: open the link → share menu → **Add to Home Screen**. It then starts full-screen like an app (singleplayer also works offline).

Online: one player taps **ONLINE 1 VS 1 → CREATE ROOM** and shares the 6-digit code (or the invite link), the other taps **JOIN ROOM** and types it. Free, peer-to-peer (WebRTC via the free PeerJS server), no accounts.

## Source
- `game/src/*.js` – the game, concatenated in filename order by `game/build.py` → `game/dist/index.html`
- `game/build_web.py` – turns the build into this site (index.html, manifest, service worker, icons)
- `game/tests/` – headless Playwright tests
- `game/SOUL_BREAKERS_PROJECT_CONTEXT.md` – full design/handoff notes

Deploy: `cd game && python3 build.py && python3 build_web.py ..` then commit and push to `main`.
