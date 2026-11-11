---
"tempest.games": patch
---

Render Tempest's browser frontend with @atom.io/spa, including account flows, Carbiter, realtime rooms, and HEXIOM's animated interface and Three.js board. Preserve the original board colors, text rendering, high-DPI sharpness, shared layout transitions, turn banner, and camera spring, and anchor the account popover through SPA's Floating UI integration. Replace the React debugger with SPA devtools while keeping React email rendering on the server.

Initialize authenticated usernames before mounting room services so host permissions are available immediately after sign-in.

Preserve persistent application state during component hot reloads, and apply form submission and focus work after the updated DOM is committed.
