---
slug: timeline
title: Timeline
summary: A history tracker for undoing and redoing state changes.
packages:
  - atom.io
  - atom.io/react
related:
  - transaction
  - mutable-atom
  - transceiver
---

A timeline records changes to a group of reactive values so they can be undone
and redone.

Timelines pair naturally with transactions. A transaction can describe a
meaningful operation, while a timeline records the resulting changes as history.

Use timelines for editors, design tools, form flows, and other interfaces where
users expect undo and redo.
