---
slug: atom-family
title: Atom Family
summary: A function that creates related atoms from parameter keys.
packages:
  - atom.io
related:
  - atom
  - selector-family
  - transaction
---

An atom family creates many atoms that share the same declaration shape but have
different parameter keys.

Families are useful when the number of states is dynamic, such as records by id,
nodes on a canvas, rows in a table, or documents in a workspace.

The family call returns the atom token for a specific key. Track the active keys
separately when you need to iterate over family members.
