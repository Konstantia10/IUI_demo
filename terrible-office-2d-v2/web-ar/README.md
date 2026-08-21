# Terrible Office — WebAR edition

This is a separate AR version of the 2D project. It uses A-Frame 1.5.0 and MindAR 1.2.5 image tracking.

## Run

Camera access requires HTTPS on a phone. For desktop development, `localhost` is accepted by browsers:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/web-ar/` and allow camera access. Display `assets/office-poster.jpg` on another screen or print it, and point the camera at the complete poster.

Do not double-click `index.html` or open a `file:///...` address. Browsers block the camera and MindAR target loading from local-file pages.

For phone testing, deploy this folder to an HTTPS static host. Opening it through a LAN IP over plain HTTP will normally block the camera.

## Why AR instead of reproducing the 2D UI

- Instructions are registered directly over the corresponding objects in the poster.
- The user searches and moves physically, practicing spatial attention rather than selecting from an abstract menu.
- Target-found/lost feedback teaches correct scanning distance and framing.
- Animated spatial confirmation shows where an item came from and where it belongs.
- A restrained miniature desk projects beyond the poster's top edge instead of obscuring its image.
- Foreground, middle, and back objects are widely separated so viewpoint movement produces clear parallax.
- Only the current task object and destination glow, keeping the tracked poster readable.
- Tones and vibration reinforce successful placement on supported devices.
- The final task reveals a restored office without adding persistent clutter to the poster.
- The image remains usable as a normal poster while the phone adds an optional interactive layer.

## Files

- `assets/office-target.mind`: compiled MindAR features for the office poster.
- `assets/office-poster.jpg`: printable/displayable recognition target.
- `index.html`: A-Frame/MindAR scene and HUD.
- `ar-app.js`: target tracking and cleanup state machine.
- `styles.css`: mobile AR interface.
