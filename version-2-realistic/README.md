# A Terrible Day at the Office — Version 2.1

This version replaces the primitive paper, coffee mug, printer and waste bin with GLB models while keeping the working interactions from Version 2.

## Important setup step

The compiled MindAR target file was not among the four uploaded GLB files. Copy the `.mind` file from your existing working project to:

```text
assets/targets/office-target.mind
```

The application expects this exact path:

```text
./assets/targets/office-target.mind
```

A copy of the target image is included only as a reference:

```text
assets/targets/office-target-reference.jpg
```

## Folder structure

```text
terrible-day-office-v2.1/
├── index.html
├── README.md
└── assets/
    ├── models/
    │   ├── bin.glb
    │   ├── coffee-mug.glb
    │   ├── paper.glb
    │   └── printer.glb
    └── targets/
        ├── office-target.mind        ← copy this from your working project
        └── office-target-reference.jpg
```

## Run locally

Do not open `index.html` directly with a `file://` URL. Use a local web server, such as the VS Code **Live Server** extension.

1. Open this folder in VS Code.
2. Copy your existing `office-target.mind` into `assets/targets/`.
3. Right-click `index.html`.
4. Select **Open with Live Server**.
5. Test on a phone using HTTPS or another camera-permitted setup.

## Architecture

Each interactive object is a parent entity with two children:

1. A visible GLB model.
2. A transparent primitive collider.

The interaction component is attached to the parent. This keeps appearance, touch targeting and behaviour separate.

## Initial model transforms

The supplied models use different source units, so they have different scales:

- Bin: `.35 .35 .35`
- Paper: `.20 .20 .20`
- Coffee mug: `.0057 .0057 .0057`
- Printer: `.68 .68 .68`

These are informed starting values. Small changes may still be needed depending on how the models look relative to your physical target image and phone camera.

## Quick adjustment guide

In `index.html`, find the relevant `<a-gltf-model>` and edit:

```html
scale="x y z"
rotation="x y z"
position="x y z"
```

Change values gradually. For example:

```html
scale=".0057 .0057 .0057"
```

to:

```html
scale=".0052 .0052 .0052"
```

for a slightly smaller mug.
