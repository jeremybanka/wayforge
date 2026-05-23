---
slug: store
title: Store
summary: The runtime state container that holds atom and selector values.
packages:
  - atom.io
related:
  - atom
  - selector
  - silo
---

A store is the runtime container where atom.io keeps state values, dependency
relationships, subscriptions, and derived results.

Most app code uses the default store through functions such as `getState`,
`setState`, and `subscribe`. Tests and isolated workflows can use a separate
store through `Silo`.

Think of tokens as references and the store as the place where those references
are resolved to live values.
