# Selector

A reactive value derived from atoms or other selectors.

Source: src/concepts/selector.md
Packages: atom.io
Related: atom, selector-family, loadable

A selector is a reactive value computed from other reactive values. Its `get`
function reads atoms or selectors and returns the derived result.

Selectors stay connected to their dependencies. When a dependency changes, the
selector can be recomputed and its subscribers can observe the new value.

Use selectors for derived views, formatted values, filtered collections, and
other state that should not be stored separately from its source data.
