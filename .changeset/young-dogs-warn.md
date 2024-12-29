---
"flightdeck": patch
---

✨ Include a new option when instantiating `new FlightDeck`, called `jsonLogging`. When enabled, logs are sent to stdout in jsonl format (JSON parsable lines). A flightdeck_log.json format for lnav is included in the dist folder and can be installed with `lnav -i node_modules/flightdeck/dist/flightdeck_log.json`.
