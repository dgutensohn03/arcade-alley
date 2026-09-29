# Arcade Alley

An original 8-bit shooting gallery inspired by the quick identification rhythm of classic NES light-gun games. The characters, scenes, sprite sheet, and music are original. The published game needs no build tools.

**[Play Arcade Alley in your browser](https://dgutensohn03.github.io/arcade-alley/)** · Works with mouse or touch. Landscape is the intended phone orientation. Starting on a touch device opens an immersive play view; browsers that support native fullscreen and orientation lock use them, while others keep the game within the viewport and show a rotate prompt.

## Play

Open `index.html` in a current desktop or mobile browser, or serve the folder with `python3 -m http.server 8080` and visit `http://localhost:8080`.

- Click or tap a threat to fire. Do not shoot civilians.
- Mouse: point and click. Touch: tap where you want to fire.
- **R** or the reload button: reload six shots. **P**: pause. **M**: sound. **C**: toggle the visible aim assist. **F**: fullscreen.
- Complete 12 waves across four districts. Every fourth wave is a bonus round. Three strikes end the run. The best score is stored in your browser.
- The four districts introduce the Strongman, Oligarch, Propagandist, and Algorithm. Civilians include a journalist, commuter, musician, delivery rider, tourist, and photographer. Each has distinct original pixel art.
- Targets pop into view, idle in short pixel animation cycles, react to hits, and clear between sets. The skyline lights and title roster animate too.
- Each district uses three fixed, numbered target lanes. Authored friend-or-foe formations change by wave and set, so the character placement reads as part of the scene.

The aim assist starts on for the mouse. Turning it off hides the reticle until you fire, closer to the light-gun feel. A touchscreen remains direct touch targeting. The optional phone-as-a-separate-controller concept needs a paired sensor transport and calibration; this version does **not** claim that a phone's gyroscope accurately points at another display.

## GitHub Pages

The public game URL is **https://dgutensohn03.github.io/arcade-alley/**. The [Pages deployment workflow](.github/workflows/deploy.yml) packages the game files and sprite atlas and publishes them automatically on every push to `main`. In **[Settings → Pages](https://github.com/dgutensohn03/arcade-alley/settings/pages)**, **GitHub Actions** is the recommended publishing source for this workflow. Check the **Deploy Arcade Alley** run under the **Actions** tab if a future update does not appear.

The site is static, uses relative file paths, and needs no secrets, build command, or server. The `.nojekyll` file tells Pages to serve these files directly.

## Structure

- `index.html` — semantic shell and controls
- `styles.css` — responsive arcade cabinet presentation
- `logic.js` — hit rules and scoring, also usable by Node tests
- `game.js` — canvas art, animation, scenes, input, game state, and original Web Audio chiptune
- `assets/sprites.png` and `assets/sprites.json` — transparent, four-frame pixel sprite atlas and frame map
- `scripts/build-sprites.js` — rebuilds the atlas from the game artwork with Node.js and no packages
- `tests/logic.test.js` — core gameplay rules
- `tests/game-render.test.js` — start-screen and sprite-animation smoke check
- `.github/workflows/check.yml` — runs the logic tests on each push and pull request
- `.github/workflows/deploy.yml` — publishes the game to GitHub Pages on each push to `main`

Run `node --test tests/*.test.js` for logic tests. The project is intentionally dependency free.

## Future controller

A separate phone controller should pair with the game via an authenticated short-lived session and explicitly calibrate screen corners. Orientation sensors drift and have browser permission rules, so camera or IR tracking would be more reliable for literal point-at-screen aiming. That controller can feed the same `fireAt(x, y)` path already used by pointer input.
