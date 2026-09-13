---
"break-check": patch
---

Make `--help` and `-h` print usage and exit successfully without loading configuration or running checks, including on the `schema` command. Help requested through configuration also exits before running checks.
