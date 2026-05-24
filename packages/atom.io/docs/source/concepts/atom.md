---
slug: atom
title: Atom
summary: An independently established source-of-truth value identified by a stable key.
packages:
  - atom.io
related:
  - selector
  - atom-family
  - store
---

An atom is the smallest source-of-truth state primitive in atom.io. It has a
key, a TypeScript value type, and a default value.

Use an atom when the new state is independently established: data that has its
own source of truth and is not merely a computed view of atoms or selectors.

Calling `atom` returns an atom token. The token is a reference to state, not the
state value itself. Read it with `getState`, update it with `setState`, observe
it with `subscribe`, or pass it to framework bindings such as `useO`.

If the value can be derived from one or more existing states, use a selector
instead. Keep atoms small so interactive code can update efficiently and
subscribers only react to the state they actually read.
