---
"atom.io": patch
---

✨ `atom.io/immortal` now permits `findState`. Though, it may return a `counterfeit` token.

- A `counterfeit` token is a reference to a state that is not actually created in the store, but does belong to a real family that is known to the store.
- We create a counterfeit token when we attempt to `findState`, but we are not permitted to initialize the state we need to find. This can happen in `immortal` stores, where we cannot create free-floating states, but must have previously reserved space for them using the `moleculeFamily` function.
- Counterfeit is the best of several undesirable options where we cannot return a real token:
  - We could throw an error. This is not preferred because it can lead to unstable production environments and frustrating developer environments.
  - We could return `undefined`. This is not preferred because it overwhelms the developer with constant null checks in situations where the state is practically  guaranteed to exist.
  - We can return a functional facsimile (a counterfeit) and log a detailed warning. We prefer this option because it will bring undefined behavior to the developer's attention without demanding their immediate attention.