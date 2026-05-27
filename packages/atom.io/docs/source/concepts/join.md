---
slug: join
title: Join
summary: A helper for managing bidirectional relations between keys.
packages:
  - atom.io
related:
  - selector-family
  - atom-family
  - transaction
---

`join` manages a bidirectional relation between two sets of keys.

It is useful when either side of a relationship needs to answer questions about
the other side, such as tracks in a playlist and playlists that include a track.

Use `join` when maintaining both directions manually would make the state model
harder to trust.
