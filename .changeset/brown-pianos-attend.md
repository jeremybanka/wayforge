---
"flightdeck": minor
---

💥 BREAKING CHANGE: The secret the flightdeck server held for authentication with an update reporter (Klaxon) was previously sought as a config option "secret". Now it is an optional environment variable "FLIGHTDECK_SECRET". If the variable is not set, the server will not run and a warning will be logged.
