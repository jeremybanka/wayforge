# todo

- [x] move sessionKey to an HTTP-only cookie
- [x] use Temporal instead of Date
- [ ] add favicon
- [ ] add email icons
- [ ] add animations to frontend
- [ ] move sessions from in-memory to durable storage

## SPA release prerequisites

- [ ] Upstream the frontend bindings in `src/frontend/services/realtime-hooks.ts` to `@atom.io/realtime/spa` before release, then replace the local imports with that entrypoint.
- [ ] Cover the upstream bindings with consumer tests for shared pull leases, family members, mutable updates, room/user identity changes, reconnects, and disposal. Keep the SPA store and socket explicit in the upstream API; Tempest currently binds its single application socket locally.
- [x] Adopt SPA 0.0.6, use its Floating UI capability for account menu positioning, and remove the SVG spread-order and text-children workarounds.
- [x] Use module-level keyed families and public `disposeState` cleanup for transient UI state; remove the internal state-creation helper. Document the blessed pattern upstream in [atom.io#1512](https://github.com/jeremybanka/atom.io/issues/1512).
- [x] Verify two authenticated browsers against the real backend: room creation and joining, setup and color choices, tile/cube pointer drags, turn transfer, turn restart and rollback, transport disconnect/reconnect, page reload, and room deletion. Both clients agreed on the board, with no uncaught browser errors.

- [x] Compare matched React/SPA screenshots for desktop light/dark boards, mobile board, login, account, desktop/mobile popovers, setup, and high-DPI rendering. Restore transparent ACES rendering, SDF labels, logo proportions, anchored popovers, shared layout motion, original banner keyframes, and spring camera focus.
