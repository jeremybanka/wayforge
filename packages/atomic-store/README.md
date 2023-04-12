# MVP
- [x] atoms and selectors
- [x] implicit store
- [x] readonly selectors
- [x] settable selectors
- [x] safe recursive update propagation
- [x] safely expose atoms and selectors
- [x] give atoms and selectors separate types with a common base
- [x] utility function to pass logger to your store
- [x] selector memoization
- [x] atom and selector families
- [x] atom effects
- [x] transactions

# Features
- [ ] atom default as function
- [ ] atom default as promise
- [ ] resettable atoms
- [ ] resettable selectors
- [ ] optional default value for atoms
- [ ] optional state keys
- [ ] subscribe to transactions
- [ ] logging levels (debug, info, warn, error)

# Performance Enhancements
- [ ] refactor selector dependencies to be asymmetrical
      this would permit us to rebuild the dependency graph on every update,
      meaning more efficient memoization
- [ ] only propagate updates downstream to selectors with an active subscription
- [ ] trampoline for recursive propagation
