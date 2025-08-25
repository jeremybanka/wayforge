---
"atom.io": patch
---

🐛 Fixed issue where some writable selectors were still (erroneously) being eagerly computed upon creation. Now, they wait until the last possible moment to be given values like other states.
