## features
- [x] atoms and selectors
- [x] implicit store
- [x] readonly selectors
- [x] settable selectors
- [x] "tokens" safely expose atoms and selectors
- [x] give atoms and selectors separate types with a common base
- [x] utility function to pass logger to your store
- [x] selector memoization
- [x] atom and selector families
- [x] atom effects
- [x] transactions
- [x] async effects
- [x] atom default as function
- [x] check whether an atom is "default" (never set)

# atom.io
## upcoming features
- [ ] timelines
- [ ] resettable atoms
- [ ] resettable selectors
- [ ] subscribe to transactions
- [ ] subscribe to token creation
- [ ] logging levels (debug, info, warn, error)
- [ ] store observation api

## fixes & improvements
- [x] refactor selector dependencies to be asymmetrical
- [ ] tokens explicitly contain the key of their family
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
