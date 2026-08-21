# Terrible Office — WebAR edition

This is a separate AR version of the 2D project. It uses A-Frame 1.5.0 and MindAR 1.2.5 image tracking.

## Run

Camera access requires HTTPS on a phone. For desktop development, `localhost` is accepted by browsers:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/web-ar/` and allow camera access. Display or print `assets/office-target-clean-grayscale-v2.png`, and point the camera at the complete poster.

The classroom poster is a cleaned grayscale scene. All messy objects exist only in AR and use grayscale WebGL shaders so they match the print.

Use the phone in landscape orientation. Mobile Safari does not allow an ordinary webpage to force orientation, so the page shows a non-blocking rotation prompt and resizes the AR renderer when the viewport rotates. Tracking uses MindAR's responsive One Euro filter defaults (`filterMinCF: 0.001`, `filterBeta: 1000`) so registered content follows camera movement without the severe lag caused by over-smoothing.

Do not double-click `index.html` or open a `file:///...` address. Browsers block the camera and MindAR target loading from local-file pages.

For phone testing, deploy this folder to an HTTPS static host. Opening it through a LAN IP over plain HTTP will normally block the camera.

## Why AR instead of reproducing the 2D UI

- Instructions are registered directly over the corresponding objects in the poster.
- The user searches and moves physically, practicing spatial attention rather than selecting from an abstract menu.
- Target-found/lost feedback teaches correct scanning distance and framing.
- Animated spatial confirmation shows where an item came from and where it belongs.
- Task 1: drag two photo-real crumpled paper balls into the photographed bin; throws use gravity and visible tumble.
- Task 2: drag a realistic tissue across the digital spill, then tap the fallen mug to reveal the upright mug in the print.
- Task 3: drag a realistic document stack onto the right shelf, where it files itself and disappears.
- Since the printed target is already clean, completed digital clutter disappears naturally; no restoration patches are required.
- The three grouped tasks and their order match the classical 2D version.
- Direct pointer-to-target-plane dragging remains registered while the camera moves.
- The experience uses no platform, room, labels, or furniture overlay.
- Tones and vibration reinforce successful placement on supported devices.
- The final task reveals a restored office without adding persistent clutter to the poster.
- The image remains usable as a normal poster while the phone adds an optional interactive layer.

## Files

- `assets/office-target.mind`: compiled MindAR features for the recognition target.
- `assets/office-target-clean-grayscale-v2.png`: printable cleaned grayscale recognition target.
- `assets/paper-ball-photo.png`: photo-real transparent paper sprite used by the tracked interaction.
- `assets/wastebasket-photo.png`: photo-real transparent wastebasket sprite aligned with the photographed bin.
- `assets/coffee-mess.png`: fallen mug and spill sprite.
- `assets/fallen-mug.png`: mug-only sprite used after wiping.
- `assets/cleaning-tissue.png`: tissue used for the wipe gesture.
- `assets/document-stack.png`: document stack used for shelf filing.
- `index.html`: A-Frame/MindAR scene and HUD.
- `ar-app.js`: target tracking and cleanup state machine.
- `styles.css`: mobile AR interface.
