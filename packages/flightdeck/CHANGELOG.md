# flightdeck

## 0.2.7

### Patch Changes

- 37d43c5: 🔇 Remove log level from log.

## 0.2.6

### Patch Changes

- 71de843: 🔊 Improved lnav format to read with a more regular pattern: `TIMESTAMP pid:package:service: [level] Message`

## 0.2.5

### Patch Changes

- 1c68bbb: ✨ FlightDeck now puts update from the command line parser into json log format. May add a variable that enables this mode in the future.
- 1c68bbb: ✨ Include a new option when instantiating `new FlightDeck`, called `jsonLogging`. When enabled, logs are sent to stdout in jsonl format (JSON parsable lines). A flightdeck_log.json format for lnav is included in the dist folder and can be installed with `lnav -i node_modules/flightdeck/dist/flightdeck_log.json`.
- Updated dependencies [1c68bbb]
  - atom.io@0.30.6

## 0.2.4

### Patch Changes

- Updated dependencies [b17d2d3]
  - atom.io@0.30.5

## 0.2.3

### Patch Changes

- Updated dependencies [93b721c]
  - atom.io@0.30.4

## 0.2.2

### Patch Changes

- Updated dependencies [8f6fc6c]
  - atom.io@0.30.3

## 0.2.1

### Patch Changes

- 02617b1: ✨ Add an option `scripts.checkAvailablity` to FlightDeck which takes a single argument, the new package version. Exit code 0 to confirm that the version is available; exit code 1 to keep trying.

## 0.2.0

### Minor Changes

- 6ec8f2d: 💥 BREAKING CHANGE: Processes managed by flight-deck are now expected to self-close when sent the signal `"timeToStop"` via IPC.

## 0.1.3

### Patch Changes

- Updated dependencies [a9d15f3]
  - atom.io@0.30.2

## 0.1.2

### Patch Changes

- Updated dependencies [331800a]
- Updated dependencies [331800a]
  - atom.io@0.30.1
  - comline@0.1.6

## 0.1.1

### Patch Changes

- comline@0.1.5

## 0.1.0

### Minor Changes

- 9bf38b2: 💥 BREAKING CHANGE: The secret the flightdeck server held for authentication with an update reporter (Klaxon) was previously sought as a config option "secret". Now it is an optional environment variable "FLIGHTDECK_SECRET". If the variable is not set, the server will not run and a warning will be logged.
- 9bf38b2: 💥 BREAKING CHANGE: The port the flightdeck server ran on was previously sought as an environment variable "PORT". It is now an optional config option "port".

## 0.0.15

### Patch Changes

- 1534303: 🔊 Add command line logs.
- Updated dependencies [1534303]
  - comline@0.1.4

## 0.0.14

### Patch Changes

- c111c9a: 🔊 Added a log for when an unauthorized Klaxon request hits the flightdeck server.

## 0.0.13

### Patch Changes

- comline@0.1.3

## 0.0.12

### Patch Changes

- Updated dependencies [0098170]
  - comline@0.1.2

## 0.0.11

### Patch Changes

- Updated dependencies [a8781d3]
- Updated dependencies [a8781d3]
  - atom.io@0.30.0

## 0.0.10

### Patch Changes

- Updated dependencies [fda0419]
  - atom.io@0.29.5

## 0.0.9

### Patch Changes

- Updated dependencies [8731eb0]
  - atom.io@0.29.4

## 0.0.8

### Patch Changes

- Updated dependencies [072a7fb]
  - atom.io@0.29.3

## 0.0.7

### Patch Changes

- e9e479d: 🐛 FlightDeck now sends a "SIGINT" to the processes it kills.

## 0.0.6

### Patch Changes

- 64adab0: 💥 Only pass a string to spawn a process.

## 0.0.5

### Patch Changes

- 3d2d7f9: 💥 Outsourced package management for compatibility with npm.

## 0.0.4

### Patch Changes

- 4f49c6b: ✏️ Fix inconsistent casing of the word "flightdeck" in the option "flightdeckRootDir".
- 4f49c6b: 🐛 Only allow 3 retries, inadvertently allowed 4 previously by a on OBO error.
- 4f49c6b: 🔊 Greatly improved the consistency of flightdeck's logs.

## 0.0.3

### Patch Changes

- fb286da: ✨ Allow for multiple executable services in a single flightdeck.
- b88e7eb: ✨ Add the new "Klaxon" module for notifying flightdeck servers.
- d5bbb78: 🐛 Switched the flightdeck server to HTTP/1.1 from HTTP/2. Nginx does not offer sufficient HTTP/2 support.
- Updated dependencies [b88e7eb]
- Updated dependencies [fb286da]
  - comline@0.1.1
  - atom.io@0.29.2

## 0.0.2

### Patch Changes

- Updated dependencies [d9e8e77]
- Updated dependencies [d9e8e77]
  - atom.io@0.29.1

## 0.0.1

### Patch Changes

- 05f66ce: 📝 Add a readme to flightdeck.
- Updated dependencies [05f66ce]
  - comline@0.1.0
