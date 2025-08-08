---
"atom.io": minor
---

💥 For a more convenient experience using the `atom` and `atomFamily` functions, the "mutable" overloads for creating mutable atoms have been moved to their own functions, `mutableAtom` and `mutableAtomFamily`, respectively. They behave exactly the same, except the `mutable: true` flag is no longer necessary to pass.

This is how mutable atoms have been created previously:

```typescript
import { atom } from 'atom.io';

const myAtom = atom<SetRTX<string>, SetRTXJson<string>>({
  key: 'myAtom',
  default: 0,
  mutable: true,
  toJson: (set) => set.toJSON(),
  fromJson: (json) => SetRTX.fromJSON(json),
});
```

Now, this is done instead:
```typescript
import { mutableAtom } from 'atom.io';

const myAtom = mutableAtom<SetRTX<string>, SetRTXJson<string>>({
  key: 'myAtom',
  default: 0,
  toJson: (set) => set.toJSON(),
  fromJson: (json) => SetRTX.fromJSON(json),
});
```
