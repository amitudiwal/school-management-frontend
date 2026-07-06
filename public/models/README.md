# 3D Bus Asset Catalog

This directory contains the 3D model asset representing the school bus.

## File Details

- **File**: `bus.glb`
- **Format**: GLB (binary glTF 2.0)
- **Source**: Sourced from Situm's 3D demo asset catalog. It is a lightweight, low-poly 3D school bus model suitable for real-time web mapping overlays.
- **License**: Free to use/demonstration license.

## Production Use and Customization

For production environments, you can replace `bus.glb` with any other 3D model of your choice:
1. Ensure the new file is named `bus.glb`.
2. Ensure it is exported as a standard self-contained GLB file (binary glTF) with textures embedded.
3. Replace the file in this folder (`frontend/public/models/bus.glb`).
4. The map's 3D projection engine (`Bus3DLayer.jsx`) automatically normalizes the model's bounding box and handles centering and wheel-height alignment dynamically, so any model scale or pivot orientation will fit automatically.
