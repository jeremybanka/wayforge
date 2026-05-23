---
slug: effect
title: Effect
summary: Setup logic that can hydrate an atom or react to atom changes.
packages:
  - atom.io
related:
  - atom
  - catch
  - store
---

An atom effect is setup logic attached to an atom declaration.

Effects can hydrate an atom with `setSelf`, observe changes with `onSet`, or
connect atom state to an external system such as storage, URLs, or a service
boundary.

Use effects when state needs lifecycle-aware integration behavior that belongs
with the atom declaration.
