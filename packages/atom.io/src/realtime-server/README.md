# CLIENT ACTS AND REPORTS
- [x] input event fires
- [x] event handler runs transaction
  - [x] client store updates optimistically
- [ ] on success
  - [ ] client generates transactionId and optimistic TransactionUpdate
  - [ ] client pushes TransactionUpdate to TimelineData.history
  - [ ] client sets TransactionUpdate in optimisticTransactions map by transactionId
  - [ ] client emits TransactionRequest { key, params, transactionId }

# SERVER VALIDATES, INTEGRATES, AND BROADCASTS
## use
- [x] server receives TransactionRequest
  - `{ key, params, transactionId }`
- [ ] verify `transactionId` is unique
- [ ] server adds timestamp to `TransactionRequest`
  - `{ key, params, transactionId, timestamp }`
- [ ] server runs transaction, computing `TransactionUpdate` in the process
  - [ ] emit `TransactionUpdate` 
    - `{ key, params, transactionId, timestamp, atomUpdates, output }`
- [ ] server adds `TransactionUpdate` to TimelineData.history

# CLIENT BEHOLDS AND REACTS
- [ ] client receives official TransactionUpdate
  - [ ] client retrieves its own TransactionUpdate from optimisticTransactions map
  - [ ] client compares official and optimistic TransactionUpdates
    - [ ] (stringify atomUpdates and compare strict)
  - [ ] if match, client removes TransactionUpdate from optimisticTransactions map
  - [ ] if mismatch
    - [ ] client undoes timeline until it finds its own TransactionUpdate
    - [ ] client replaces its own TransactionUpdate with official TransactionUpdate
    - [ ] client removes its own TransactionUpdate from optimisticTransactions map
    - [ ] client redoes timeline until it reaches the "HEAD"
