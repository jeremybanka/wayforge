---
"recoverage": patch
---

🚀 In CI, recoverage would previously fetch the main branch twice, with each fetch taking ~500ms. Now it only fetches once, reducing running time on github actions by ~;25%.
