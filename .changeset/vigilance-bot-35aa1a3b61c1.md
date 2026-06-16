---
"hamr": patch
---

Release a patched production dependency graph for moderate, high, and critical advisories that were still present in the latest npm-published packages.

- high GHSA-96hv-2xvq-fx4p, 1120730 in ws: ws: Memory exhaustion DoS from tiny fragments and data chunks (https://github.com/advisories/GHSA-96hv-2xvq-fx4p). Published packages resolved 8.20.1; the current workspace resolves 8.18.3, 8.21.0.
