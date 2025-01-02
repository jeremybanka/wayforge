# tempest.games

## 0.1.23

### Patch Changes

- 71de843: ✏ Fix a typo in the ready log.

## 0.1.22

### Patch Changes

- Updated dependencies [1c68bbb]
  - atom.io@0.30.6

## 0.1.21

### Patch Changes

- Updated dependencies [b17d2d3]
  - atom.io@0.30.5

## 0.1.20

### Patch Changes

- Updated dependencies [93b721c]
  - atom.io@0.30.4

## 0.1.19

### Patch Changes

- eee505e: 🐛 ixed bug where tribunal would throw when trying to ban an IP again.
- eee505e: 🐛 Added missing `interactive-db` script to bin.

## 0.1.18

### Patch Changes

- ab05b2c: 🐛 Fix an administrator-side bug where logs could be emitted by dependencies of the application, breaking the process manager's logging flow.

## 0.1.17

### Patch Changes

- Updated dependencies [8f6fc6c]
  - atom.io@0.30.3

## 0.1.16

### Patch Changes

- 806a254: 🐛 Fix issue where the frontend would not shut down when updates are ready.
- e4662c3: ✨ Added an entrypoint for using Drizzle Studio from the production instance.

## 0.1.15

### Patch Changes

- d751bc4: 🐛 Improvements to capitalization handling for usernames and emails.

## 0.1.14

### Patch Changes

- 6361363: 💄 Logo is now readable in light mode.

## 0.1.13

### Patch Changes

- 337e558: 🛸 Update processes to work with the new flightdeck constraints.

## 0.1.12

### Patch Changes

- c853b23: 🐛 Fix bug where all logging was broken due to a database logger.

## 0.1.11

### Patch Changes

- 408497b: 🐛 Fix bug where sometimes internal links would hard-navigate when clicked.

## 0.1.10

### Patch Changes

- Updated dependencies [a9d15f3]
  - atom.io@0.30.2

## 0.1.9

### Patch Changes

- 331800a: 🔊 Add atom.io logging.
- 331800a: 🐛 Fixed broken redirect on signup.
- 331800a: 🐛 Fixed flash of 401 on login.
- 331800a: 🔊 Added database logging.
- Updated dependencies [331800a]
- Updated dependencies [331800a]
- Updated dependencies [331800a]
  - treetrunks@0.0.3
  - atom.io@0.30.1

## 0.1.8

### Patch Changes

- d191b75: 💄 Improved styles on mobile.
- Updated dependencies [d191b75]
  - treetrunks@0.0.2

## 0.1.7

### Patch Changes

- e8e7a6a: 🐛 Fix bug where ban generator would look for cached responses that wouldn't/shouldn't exist.

## 0.1.6

### Patch Changes

- c706046: 🐛 Improved conditions for determining whether code is running on server or client.

## 0.1.5

### Patch Changes

- ef3286b: 🐛 Fix missing environment variables on frontend.

## 0.1.4

### Patch Changes

- 1e65a15: 🗃️ Include database migrations.

## 0.1.3

### Patch Changes

- 4970d8b: ✨ Include db setup script.

## 0.1.2

### Patch Changes

- 47c52e1: ✨ Automatically ban suspicious IPs at the network level.

## 0.1.1

### Patch Changes

- 6be0203: ✨ Validations and security.

  - Enhanced backend security by adding IP tracking and banning for multiple failed login attempts.
  - Improved signup and login forms with error handling, validation feedback, and input readiness checks.
  - Extended database schema to include user tracking and login history tables.
  - Added a list of common passwords to restrict in password validation.
  - Introduced new admin view component and updated global styles.
  - Added tests for password complexity validation.
  - Updated package.json with new database scripts and dependencies.

- 0098170: 💄 Added some general styles.
- 2f0434c: ✨ Basic login/signup flow.

## 0.1.0

### Minor Changes

- 9f66128: ✨ Add database with user accounts and games.

### Patch Changes

- Updated dependencies [a8781d3]
- Updated dependencies [a8781d3]
  - atom.io@0.30.0

## 0.0.13

### Patch Changes

- Updated dependencies [fda0419]
  - atom.io@0.29.5

## 0.0.12

### Patch Changes

- Updated dependencies [8731eb0]
  - atom.io@0.29.4

## 0.0.11

### Patch Changes

- 4270cd7: ✨ Add explicit teardown functions.

## 0.0.10

### Patch Changes

- 072a7fb: ✨ Realtime continuities demo.
- Updated dependencies [072a7fb]
  - atom.io@0.29.3

## 0.0.9

### Patch Changes

- 28a83df: ✨ Redirect /index.html to /

## 0.0.8

### Patch Changes

- 306e3a8: 🐛 Fix bug where frontend would start on the wrong port.

## 0.0.7

### Patch Changes

- 1c064f9: 🐛 Fix bug where application assets were missing.

## 0.0.6

### Patch Changes

- f36d18f: 🐛 Use ParentSocket for logging.

## 0.0.5

### Patch Changes

- 8cf0e94: ♻️ Bun

## 0.0.4

### Patch Changes

- 60d6508: ♻️ Split application into parts.

## 0.0.3

### Patch Changes

- d73aa4b: 🔧 Access: Public

## 0.0.2

### Patch Changes

- 17188e0: 📦 Publish on NPM.

## 0.0.1

### Patch Changes

- b88e7eb: 🎉 hello vite!
