---
slug: selector
title: Selector
summary: A value that follows from atoms or other selectors instead of being stored separately.
packages:
  - atom.io
related:
  - atom
  - selector-family
  - loadable
---

A selector is a reactive value computed from other reactive values. Its `get`
function reads atoms or selectors and returns the derived result.

Use a selector when the new state follows from one or more atoms or selectors.
Do not store that value separately in an atom unless it has its own independent
source of truth.

Selectors stay connected to their dependencies. When a dependency changes, the
selector can be recomputed and its subscribers can observe the new value.

Use selectors for derived views, formatted values, filtered collections, and
other state that should not be stored separately from its source data.
