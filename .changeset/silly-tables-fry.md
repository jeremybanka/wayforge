---
"atom.io": patch
---

🐛 `atom.io/data` `join` fix bug where, when using `.replaceRelations` during a transaction, the result would be leaked to the store the transaction was running in. This method is now properly encapsulated, and its performance should be somewhat better for cases where relations are sorted into a new order.
