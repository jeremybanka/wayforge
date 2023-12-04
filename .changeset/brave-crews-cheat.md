---
"rel8": patch
---

✨ `Junction` adds the `replaceRelations` method, which allows you to quickly set all the relations for one entry. By default, it does this with a cleanup step, which removes incompatible relations. But optionally, by passing `{ reckless: true }`, you will override the relations for any referenced entries.