---
slug: catch
title: Catch
summary: A typed error channel for atoms and selectors.
packages:
  - atom.io
  - atom.io/react
related:
  - loadable
  - selector
  - effect
---

The `catch` option declares how an atom or selector handles a known error type.

When a reactive value has a catch channel, code that observes it can understand
the handled error shape instead of treating every failure as unknown.

Use `catch` when asynchronous or effectful state has a meaningful error type
that downstream code should be able to inspect.
