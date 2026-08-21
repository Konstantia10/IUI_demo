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
- Props sit at different depths, so moving the phone produces real parallax rather than a flat overlay.
- The monitor, lamp, fan, steam, and flies provide a continuously animated spatial environment.
- Positional tones and vibration reinforce successful placement on supported devices.
- The environment progressively changes and reveals a restored 3D office when the cleanup is complete.
- The image remains usable as a normal poster while the phone adds an optional interactive layer.

## Files

- `assets/office-target.mind`: compiled MindAR features for the office poster.
- `assets/office-poster.jpg`: printable/displayable recognition target.
- `index.html`: A-Frame/MindAR scene and HUD.
- `ar-app.js`: target tracking and cleanup state machine.
- `styles.css`: mobile AR interface.
