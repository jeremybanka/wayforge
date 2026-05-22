---
slug: loadable
title: Loadable
summary: A reactive value that may still be waiting on asynchronous work.
packages:
  - atom.io
  - atom.io/react
related:
  - selector
  - catch
  - effect
---

A loadable value represents state that may be available now, still loading, or
recovering from asynchronous work.

Async selectors can produce loadable behavior when they return promises. React
code can use `useLoadable` to observe the loaded value, loading state, and typed
error information.

Use loadable state when data comes from an asynchronous source but still needs
to participate in atom.io's reactive graph.
