---
"varmint": patch
---

Replay streamed fixtures without repeating records across file-read boundaries. Close recording files on completion, cancellation, and failure, including cancellation before the first record, and forward cancellation to the stream producer. Preserve reusable streamed iterables and original producer errors during cleanup.
