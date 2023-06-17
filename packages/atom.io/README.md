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
- [x] customizable logging
- [x] subscribe to transactions
- [x] timelines
- [x] subscribe to families

# atom.io
## upcoming features
- [ ] suppressor: ({oldValue, newValue}) => boolean
- [ ] resettable atoms
- [ ] resettable selectors

## documentation
- [ ] document atom and selector families
- [ ] document atom and selector
- [ ] document transactions

# src/internal/meta
- [x] subscribe to creation of atom tokens
- [x] subscribe to creation of selector tokens
- [x] subscribe to creation of readonly selector tokens
- [ ] reimplement state indices as selectors
- [ ] subscribe to creation of transaction tokens
- [ ] subscribe to creation of timeline tokens
- [ ] subscribe to changes in store configuration

# /react-devtools
- [ ] 

# /react
## features
- [x] useStore
- [x] useI, useO, useIO
- [ ] useTimeline
- [ ] useStoreIndex
- [ ] useTransactionIO 

# /realtime
- [ ] expose single atom and selector
- [ ] expose atom family and selector family
- [ ] receive single atom and selector
- [ ] receive atom family and selector family
- [ ] receive transaction params, run transaction
- [ ] assess transaction impact (active subscriptions influenced by transaction)
- [ ] return transaction impact as timeline event

# /react-realtime
example: what's in the box? (options: green apple, green banana, red apple, red banana)
- no player gets to see what's in the box
- player 1 can see the color of the item in the box
- player 2 can see the type of the item in the box
  - atom<`${string} ${string}`> boxItem
    - selector boxItemColor
    - selector boxItemType
  - 
- 

# /web-fx
## features
- [ ] localStorage and sessionStorage effects
