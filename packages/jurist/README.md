# jurist

```sh
npm i jurist
```

Jurist is a TypeScript-first authorization library supporting role-based access control.

## usage

### `Laws`

With Jurist, permissions are expressed in a tree structure.

```typescript
// my-authorization.ts
import { Laws, optional, required } from "jurist";

const authorization = new Laws({
  roles: ["suspended", "free", "premium"],
  permissions: required({
    create: optional({
      document: required({
        "<=5": optional({ "<=5000": null }),
        shareDocuments: null,
      }),
    }),
  }),
  rolePermissions: {
    suspended: new Set([]),
    free: new Set([
      /* a granted  permission grants all preceding permissions, e.g., 
      "create"
      "create_documents" */
      "create_documents_<=5",
    ]),
    premium: new Set([
      "create_documents_<=5_<=5000",
      "create_documents_shareDocuments",
    ]),
  },
});
```

The idea here is that some permissions must logically follow from other permissions. In other words, the `create_documents_<=5` permission is a prerequisite for the `create_documents_<=5_<=5000` permission, because if you are allowed to create 5,000 documents, you are logically allowed to create 5 documents in the first place.

This makes authorization checks easier, safer, and more explicit.

```typescript
// routes.ts
import { Roles } from "jurist";

import { authorization } from "./my-authorization";
import { app } from "./my-hono-like-app";

type Role = Roles<typeof authorization>; // "free" | "premium" | "suspended"

type User = {
  id: string;
  role: Role;
};

app.post("/api/v1/resources", async (c) => {
  const { user /* { id: "123-456", role: "free" } */ } = c.get("user");
  /* ✅ true  */ authorization.check(user.role, "create");
  /* ✅ true  */ authorization.check(user.role, "create_documents_<=5");
  /* ❌ false */ authorization.check(user.role, "create_documents_<=5_<=5000");
});
```

Here, we can see that a free user has permission to create a resource, and has permission to own up to 5 documents, but they cannot own up to 5,000 documents like a premium user.
