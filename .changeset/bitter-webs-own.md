---
"atom.io": patch
---

✨ Introducing _Held Selectors_, `atom.io`'s novel object-pooling strategy for large, reusable objects. Held Selectors (as opposed to conventional selectors, which are now called _Pure Selectors)_ keep a constant binding to a single object, and are not garbage collected when one of their dependencies updates.

```ts
const myAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
  key: `myAtom`,
  default: {
    a: [],
    b: [],
    c: [],
  },
});

const mySelector = selector<{
  a: number;
  b: number;
  c: number;
}>({
  key: `mySelector`,
  const: { a: 0, b: 0, c: 0 },
  get: ({ get }, self) => {
    const { a, b, c } = get(myAtom);
    self.a = a.reduce((acc, cur) => acc + cur, 0);
    self.b = b.reduce((acc, cur) => acc + cur, 0);
    self.c = c.reduce((acc, cur) => acc + cur, 0);
  },
});
```

A held selector requires a `const` value to be initialized. The `get` function for a held selector passes the held value of the selector to the getter function as a second parameter following the `GetterToolkit` interface. The expectation is that the getter mutates the held value and returns `void`.
