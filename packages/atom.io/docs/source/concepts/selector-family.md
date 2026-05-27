---
slug: selector-family
title: Selector Family
summary: A function that creates related selectors from parameter keys.
packages:
  - atom.io
related:
  - selector
  - atom-family
  - join
---

A selector family creates parameterized derived state. Each key gets its own
selector token, while the declaration describes how every member should compute
or update its value.

Selector families are a good fit for derived values tied to dynamic entities:
one display label per item, one SVG path per id, or one filtered query per key.

Use a selector family when the derived state depends on both reactive inputs and
a stable parameter.
