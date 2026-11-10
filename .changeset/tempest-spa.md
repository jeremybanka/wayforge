---
"tempest.games": patch
---

Render Tempest's browser frontend with @atom.io/spa, including account flows, Carbiter, realtime rooms, and HEXIOM's animated interface and Three.js board. Preserve the original board colors, text rendering, high-DPI sharpness, anchored account popover, shared layout transitions, turn banner, and camera spring. Replace the React debugger with SPA devtools while keeping React email rendering on the server.

Initialize authenticated usernames before mounting room services so host permissions are available immediately after sign-in.
