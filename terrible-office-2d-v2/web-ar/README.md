# Terrible Office — WebAR edition

This is a separate AR version of the 2D project. It uses A-Frame 1.5.0 and MindAR 1.2.5 image tracking.

## Run

Camera access requires HTTPS on a phone. For desktop development, `localhost` is accepted by browsers:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/web-ar/` and allow camera access. Display `assets/office-poster.jpg` on another screen or print it, and point the camera at the complete poster.

The classroom poster may be printed in grayscale. MindAR tracks its luminance features, while all registered sprites and restoration patches are converted to grayscale in their WebGL shaders so they visually match the printed target. The target preview is also displayed in grayscale.

Use the phone in landscape orientation. Mobile Safari does not allow an ordinary webpage to force orientation, so the page shows a non-blocking rotation prompt and resizes the AR renderer when the viewport rotates. Tracking uses MindAR's responsive One Euro filter defaults (`filterMinCF: 0.001`, `filterBeta: 1000`) so registered content follows camera movement without the severe lag caused by over-smoothing.

Do not double-click `index.html` or open a `file:///...` address. Browsers block the camera and MindAR target loading from local-file pages.

For phone testing, deploy this folder to an HTTPS static host. Opening it through a LAN IP over plain HTTP will normally block the camera.

## Why AR instead of reproducing the 2D UI

- Instructions are registered directly over the corresponding objects in the poster.
- The user searches and moves physically, practicing spatial attention rather than selecting from an abstract menu.
- Target-found/lost feedback teaches correct scanning distance and framing.
- Animated spatial confirmation shows where an item came from and where it belongs.
- Photo-real paper sprites align with objects that already exist in the photograph instead of creating a separate scene.
- Crumpled paper balls rustle subtly in place and lift only while the user is dragging them.
- The photographed wastebasket subtly breathes in place and reacts while a paper ball is being dragged toward it; no abstract target ring is used.
- Successful drops follow a gravity-shaped arc with a visible face-on tumble, then compress the bin slightly on impact.
- After impact, a small feathered crop from a cleaned version of the poster covers the original photographed paper ball, creating a localized disappearance illusion without replacing the full camera image.
- Versioned script and texture URLs prevent mobile Safari from combining a new scene with stale restoration code.
- Direct pointer-to-target-plane dragging remains registered while the camera moves.
- The experience uses no platform, room, labels, or furniture overlay.
- Tones and vibration reinforce successful placement on supported devices.
- The final task reveals a restored office without adding persistent clutter to the poster.
- The image remains usable as a normal poster while the phone adds an optional interactive layer.

## Files

- `assets/office-target.mind`: compiled MindAR features for the office poster.
- `assets/office-poster.jpg`: printable/displayable recognition target.
- `assets/paper-ball-photo.png`: photo-real transparent paper sprite used by the tracked interaction.
- `assets/wastebasket-photo.png`: photo-real transparent wastebasket sprite aligned with the photographed bin.
- `assets/office-poster-clean.png`: preservation-focused poster edit with the two loose desk paper balls removed, sampled only by the restoration patches.
- `index.html`: A-Frame/MindAR scene and HUD.
- `ar-app.js`: target tracking and cleanup state machine.
- `styles.css`: mobile AR interface.
