---
"atom.io": minor
---

💥 BREAKING CHANGE: `mutableAtom` greatly simplifies its API, removing a significant amount of boilerplate.

Previously, creating a mutable atom looked like this:

```typescript
const atom = atom<SetRTX<string>, SetRTXJson<string>({
  key: 'my-atom',
  mutable: true,
  default: () => new SetRTX<string>(),
  toJson: (value) => value.toJSON(),
  fromJson: (value) => SetRTX.fromJSON(value),
});

const mutableAtom = mutableAtom(atom);
```

Now, it can be created much more simply:

```javascript
const mutableAtom = mutableAtom({
  key: 'my-atom',
  class: SetRTX<string>,
});
```
