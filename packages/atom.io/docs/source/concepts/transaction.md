---
slug: transaction
title: Transaction
summary: A coordinated update that batches multiple state changes.
packages:
  - atom.io
related:
  - atom
  - atom-family
  - timeline
---

A transaction declares a function that can read and write multiple atoms as one
coordinated update.

Transactions are useful when one user action should make several state changes
together. They also help keep complex updates readable by naming the operation
instead of scattering calls to `setState`.

Use transactions for moves, imports, resets, multi-field edits, and other
operations where intermediate states should not become the important model.
