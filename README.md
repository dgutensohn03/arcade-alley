# Arcade Alley

An original 8-bit shooting gallery inspired by the quick identification rhythm of classic NES light-gun games. The characters, scenes, art, and music are original. No assets or build tools are required.

## Play

Open `index.html` in a current desktop or mobile browser, or serve the folder with `python3 -m http.server 8080` and visit `http://localhost:8080`.

- Click or tap a threat to fire. Do not shoot civilians.
- Mouse: point and click. Touch: tap where you want to fire.
- **R** or the reload button: reload six shots. **P**: pause. **M**: sound. **C**: toggle the visible aim assist. **F**: fullscreen.
- Complete 12 waves across four districts. Every fourth wave is a bonus round. Three strikes end the run. The best score is stored in your browser.

The aim assist starts on for the mouse. Turning it off hides the reticle until you fire, closer to the light-gun feel. A touchscreen remains direct touch targeting. The optional phone-as-a-separate-controller concept needs a paired sensor transport and calibration; this version does **not** claim that a phone's gyroscope accurately points at another display.

## Publish

Create a GitHub repository named `arcade-alley`, push these files to its default branch, and enable GitHub Pages from the branch root. The game uses relative file paths and needs no secrets or server.

## Structure

- `index.html` — semantic shell and controls
- `styles.css` — responsive arcade cabinet presentation
- `logic.js` — hit rules and scoring, also usable by Node tests
- `game.js` — canvas art, animation, scenes, input, game state, and original Web Audio chiptune
- `tests/logic.test.js` — core gameplay rules

Run `node --test tests/*.test.js` for logic tests. The project is intentionally dependency free.

## Future controller

A separate phone controller should pair with the game via an authenticated short-lived session and explicitly calibrate screen corners. Orientation sensors drift and have browser permission rules, so camera or IR tracking would be more reliable for literal point-at-screen aiming. That controller can feed the same `fireAt(x, y)` path already used by pointer input.
