---
slug: atom
title: Atom
summary: A reactive source-of-truth value identified by a stable key.
packages:
  - atom.io
related:
  - selector
  - atom-family
  - store
---

An atom is the smallest source-of-truth state primitive in atom.io. It has a
key, a TypeScript value type, and a default value.

Calling `atom` returns an atom token. The token is a reference to state, not the
state value itself. Read it with `getState`, update it with `setState`, observe
it with `subscribe`, or pass it to framework bindings such as `useO`.

Use atoms for values that can change independently. Smaller atoms usually make
interactive code easier to update efficiently because subscribers only react to
the state they actually read.
