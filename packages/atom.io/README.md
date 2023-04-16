## features
- [x] atoms and selectors
- [x] implicit store
- [x] readonly selectors
- [x] settable selectors
- [x] safe recursive update propagation
- [x] "tokens" safely expose atoms and selectors
- [x] give atoms and selectors separate types with a common base
- [x] utility function to pass logger to your store
- [x] selector memoization
- [x] atom and selector families
- [x] atom effects
- [x] transactions


# atom.io
## upcoming features
- [x] "lazy mode": only propagate updates downstream to selectors with an active subscription
- [x] async effects
- [ ] atom default as function
- [ ] check whether an atom is "default" (never set)
- [ ] timelines
- [ ] resettable atoms
- [ ] resettable selectors
- [ ] subscribe to transactions
- [ ] subscribe to token creation
- [ ] logging levels (debug, info, warn, error)
- [ ] store observation api
- [ ] optional default value for atoms
- [ ] optional state keys
## fixes & improvements
- [x] refactor selector dependencies to be asymmetrical
- [ ] apply and emit transactions all at once

## documentation
- [ ] document atom and selector families
- [ ] document atom and selector
- [ ] document transactions

# /react
## features
- [x] useSubject
- [x] useStore

# /effects
## features
- [ ] localStorage and sessionStorage effects
- [ ] socket.io server effect
- [ ] socket.io client effect
