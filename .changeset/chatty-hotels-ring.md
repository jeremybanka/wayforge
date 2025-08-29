---
"atom.io": patch
---

✨ `atom` and `selector` (as well as `atomFamily` and `selectorFamily`) add the new `catch` option.

```ts
const orgMembersAtoms = AtomIO.atomFamily<
  Loadable<User[]>,
  OrgId,
  TRPCClientError
>({
  key: `orgMembers`,
  get: trpcClient.getOrgMembers,
  default: [TRPCClientError],
});
```

With this, we can establish specifically what kinds of errors we want to catch as each atom resolves.

Kind of like Python's nice `try/except` blocks!

```ts
const orgMembers = useLoadable(orgMembersAtoms, orgId);
/*
| "LOADING"
| { loading: boolean; value: TRPCClientError }
| { loading: boolean; value: User[] }
*/
```

Now, when we `useLoadable` in a react component, we have three easy pivots:

1. If `orgMembers === LOADING`, we can render a loading state.
2. Otherwise, if `orgMembers.value instanceof TRPCClientError`, we can render an error state.
3. If it's not an error, we can map over the `orgMembers.value` array and render each member.
4. (Bonus) is `orgMembers.loading === true`, we can also render an unobtrusive loading overlay!
