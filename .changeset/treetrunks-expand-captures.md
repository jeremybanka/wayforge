---
"treetrunks": patch
---

Rename the `Deref` type utility to `ExpandCaptures` and its `VarMarker` parameter to `CapturePrefix`. Add a `RestMarker` parameter for customizing the marker immediately following the capture prefix; the defaults remain `$` and `...`. Update imports of `Deref` to use `ExpandCaptures`.
