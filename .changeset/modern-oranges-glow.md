---
"atom.io": minor
---

✨ **Basic support for asynchronous data.**

Sometimes the data you're working with comes from a process outside your control.

For example, you might use `fetch` to get data from a server:

```ts
import { atom } from 'atom.io';
import type { Fated } from 'atom.io/internal';

import { isUser, type User } from '~/store'


const userState = atom<Fateful<User>>({
  key: `user`,
  default: async () => {
    const response = await fetch('/api/user');
    const parsed = await response.json();
    const user = isUser(parsed) ? parsed : null;
    return user;
  }
})
```

In this example, we initialize the atom with a function that returns a Promise. The atom will call the function and set its state to the function's return value: a Promise. When the promise resolves, the atom will update its state to the resolved value.

| _Why would it be useful to set the atom's state to a Promise?_

When an atom enters a refetching mode, subscribers are notified with an update `{ oldValue: T; newValue: Promise<T> }`, and they may choose one of three options:

- **Do nothing** — The subscriber will continue to use the atom's current state.
- **Enter a loading state** — Expose a flag to indicate that the data is loading, while continuing to use the atom's `oldValue`.
- **Defer to React Suspense** — If the subscriber is a React component, it may prefer access to the promise itself, so it can throw it and trigger suspense.