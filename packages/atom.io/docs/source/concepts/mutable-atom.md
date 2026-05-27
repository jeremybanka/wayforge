---
slug: mutable-atom
title: Mutable Atom
summary: An atom backed by a mutable transceiver value.
packages:
  - atom.io
  - atom.io/json
related:
  - atom
  - transceiver
  - timeline
---

A mutable atom stores a transceiver: a mutable object that can report its own
updates to atom.io.

Mutable atoms are useful for collections that change frequently. Instead of
replacing an entire array or object, code can mutate the transceiver and let
atom.io capture the specific update.

Use mutable atoms for state that benefits from fine-grained collection updates,
especially when transactions or timelines are involved.
