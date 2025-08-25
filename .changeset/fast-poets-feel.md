---
"atom.io": minor
---

💥 BREAKING CHANGE: When an state is created for the first time, the event that is broadcast to subscribers will not include an `oldValue`. Only a `newValue` will be included. This only applies to subscribers to a state that placed subscriptions before the state had been given a value, which usually only applies to the `onSet` helper in atom `effects`.
