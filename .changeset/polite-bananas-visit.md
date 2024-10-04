---
"atom.io": patch
---

✨ The new Allocate API allows hierarchical allocations into a defined superstructure.

It provides a general alternative to the `moleculeFamily` API, which is still available but is now deprecated.

### New: Shapelessness
`moleculeFamily` required a specific constructor type to be passed in. This is a bit of a pain, because it required the user to maintain the shape of the molecules they were creating, which is really redundant to the types of the states that the molecule governs. The idea was, this could be a way to give the molecule its own "type".

The new way that molecules are typed is purely through the type of their associated keys, whose types must extend the `Canonical` type. A molecule is 1:1 with a key. Keys are permanent and so are fundamentally different from states.  

### No more `bond` API
`moleculeFamily` was also overly rigid in the that it required a molecule to deliberately `bond` to an atomFamily.

This is no longer a thing. Once a molecule has been allocated, any states can be added to it at any time.

See `__tests__/experimental/immortal/allocate.test.ts` for an example of how to use the new API.