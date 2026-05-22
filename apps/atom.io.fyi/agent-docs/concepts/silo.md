# Silo

An isolated atom.io store with bound state utilities.

Source: src/concepts/silo.md
Packages: atom.io, atom.io/testing
Related: store, atom, transaction

A `Silo` is an isolated store with atom.io utilities bound to it.

Silos are especially useful in tests because they let each test case create and
inspect state without sharing the app's default store.

Use a silo when you want deterministic, isolated state behavior for testing,
examples, or independent execution contexts.
