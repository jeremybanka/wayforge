---
slug: transceiver
title: Transceiver
summary: A mutable object that reports its updates to atom.io.
packages:
  - atom.io
  - atom.io/json
related:
  - mutable-atom
  - timeline
  - transaction
---

A transceiver is a mutable value that can describe its own updates.

Built-in transceivers include `UList`, which behaves like a set, and `OList`,
which behaves like an array. They let atom.io observe collection updates without
requiring a whole collection replacement every time.

Use transceivers when mutating a collection is the natural operation and atom.io
still needs to track the change reactively.
