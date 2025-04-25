---
"varmint": minor
---

💥 BREAKING CHANGE: Varmint cache filenames now include a much shorter hash in base64 format. `/` is replaced with `_` and the hash is truncated to 8 characters. When a cache key is too long, now the beginning of the key as well as the end of the key are trimmed to fit within the max length.
