## MVP
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
## features
- [ ] atom default as function
- [ ] async effects
- [ ] resettable atoms
- [ ] resettable selectors
- [ ] subscribe to transactions
- [ ] subscribe to token creation
- [ ] logging levels (debug, info, warn, error)
- [ ] store observation api
- [ ] "lazy mode": only propagate updates downstream to selectors with an active subscription
- [ ] optional default value for atoms
- [ ] optional state keys
## fixes & improvements
- [ ] refactor selector dependencies to be asymmetrical
      just include the id of the leader in the relation between the leader and the follower
      this will permit us to rebuild the dependency graph on every update
- [ ] apply and emit transactions all at once
- [ ] trampoline for recursive propagation

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
