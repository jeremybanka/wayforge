# safedeposit

```sh
bun i safedeposit
```

safedeposit is a type-hinted filesystem storage implementation.

## Usage

```ts
import { FilesystemStorage } from "safedeposit"

const storage = new FilesystemStorage({ path: `/tmp/storage` })

storage.setItem(`test`, `value`)
console.log(storage.getItem(`test`)) // "value"

storage.removeItem(`test`)
console.log(storage.getItem(`test`)) // null
```
