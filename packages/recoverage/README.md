# recoverage

`recoverage` is a command-line tool that streamlines the process of maintaining code coverage in ECMAScript projects.

The core idea is simple: **coverage should increase over time**. Recoverage supports this idea by comparing the coverage of your default branch against feature branches.

By running recoverage in CI, we can **guard against coverage regressions**. PRs that decrease coverage will fail; PRs that increase or maintain the same coverage will pass.

It's often helpful to know precisely where in our codebase coverage changed. When recoverage detects a change in coverage between our current git ref and the ref representing our current default branch, it will print a **human-readable diff of the coverage changes**.

The recoverage library and command line tool is free and open-source. You can run it on your own machine and **read a coverage diff from your own terminal**.

Recoverage works smoothly `vitest` + `@vitest/coverage-v8`, as well as many other runners. Anything that creates an istanbul-style coverage report at `coverage/coverage-final.json` will work.

> **Please Note:** Bun is required to run this tool. You can install Bun from [bun.sh](https://bun.sh).

## Persisting Coverage Reports for CI

To make a report representing your main branch available to your CI runners, you have three options:

- **Recommended**: Sign in with GitHub on [recoverage.cloud](https://recoverage.cloud) and set the following environment variables in CI:
  - `RECOVERAGE_CLOUD_TOKEN`
- **Unhosted**: Generate everything during each CI run.
  - Check out your **default** branch, run tests with coverage, then run `recoverage`.
  - Check out your **feature** branch, run tests with coverage, then run `recoverage`.
- **Self-Hosted**:
  Put your `coverage.sqlite` file in any S3-compatible storage. Then set the following environment variables in CI:
  - `S3_ACCESS_KEY_ID`
  - `S3_BUCKET`
  - `S3_ENDPOINT`
  - `S3_SECRET_ACCESS_KEY`

## Local Example

Below is an example to set up a tiny project with Bun, TypeScript, Vitest, and @vitest/coverage-v8.

### 1. Initialize the Project

Create a new directory and initialize it:

```sh
mkdir my-demo-project
cd my-demo-project
bun init
```

Then, update your package.json with the following scripts and devDependencies:

```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "test:coverage": "vitest run --coverage && recoverage capture"
  },
  "devDependencies": {
    "typescript": "^4.x",
    "vitest": "^3.x",
    "@vitest/coverage-v8": "^3.x",
    "recoverage": "workspace:*"
  }
}
```

Then, update your `package.json` with the following scripts and devDependencies:

```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "test:coverage": "vitest run --coverage && recoverage capture",
    "coverage:status": "recoverage diff"
  },
  "devDependencies": {
    "typescript": "^4.x",
    "vitest": "^3.x",
    "@vitest/coverage-v8": "^3.x",
    "tsup": "^8.x",
    "recoverage": "workspace:*"
  }
}
```

### 2. Set Up TypeScript

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "__tests__"]
}
```

### 3. Create a Source File with a Demo Function

Create the file src/demo.ts:

```ts
export function demoSwitch(input: string): string {
  switch (input) {
    case "case1":
      return "Result for case 1";
    case "case2":
      return "Result for case 2";
    case "case3":
      return "Result for case 3";
    default:
      return "Default case";
  }
}
```

### 4. Create a Test File for the Demo Function

Create the file `__tests__/demo.test.ts` with initial tests covering two cases:

```ts
import { demoSwitch } from "../src/demo";

test("demoSwitch covers case1", () => {
  expect(demoSwitch("case1")).toBe("Result for case 1");
});

test("demoSwitch covers case2", () => {
  expect(demoSwitch("case2")).toBe("Result for case 2");
});

// Initially, we do not test case3 to simulate incomplete coverage
// test("demoSwitch covers case3", () => {
//   expect(demoSwitch("case3")).toBe("Result for case 3");
// });
```

### 5. Configure Vitest Coverage Settings

Create a `vitest.config.ts` file:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ["text", "json"],
    },
  },
});
```

### 6. Initialize Git and Capture Base Coverage

Check your project into Git on the main branch:

```sh
git init
git add .
git commit -m "Initial commit with base tests"
```

Now run the tests and capture your base coverage report:

```sh
bun run test:coverage
```

This command runs Vitest (which generates coverage-final.json) and then runs recoverage capture to save your base coverage report.

## Showing Coverage Changes

### Coverage Decrease

1. **Modify the Test File:**

   Comment out one of the tests so that only one case is covered. Update **tests**/demo.test.ts as follows:

   ```ts
   import { demoSwitch } from "../src/demo";

   test("demoSwitch covers case1", () => {
     expect(demoSwitch("case1")).toBe("Result for case 1");
   });

   // test("demoSwitch covers case2", () => {
   //   expect(demoSwitch("case2")).toBe("Result for case 2");
   // });

   test("demoSwitch covers case3", () => {
     expect(demoSwitch("case3")).toBe("Result for case 3");
   });
   ```

2. **Re-Run the Tests** (and Capture Coverage):

   With floating changes on your branch, run:

   ```sh
   bun run test:coverage
   ```

   This command will detect that coverage has decreased (fewer switch cases are covered) and exit with code `1`.

### Coverage Increase

1. **Modify the Test File:**

   Uncomment one of the tests so that all cases are covered. Update **tests**/demo.test.ts as follows:

   ```ts
   import { demoSwitch } from "../src/demo";

   test("demoSwitch covers case1", () => {
     expect(demoSwitch("case1")).toBe("Result for case 1");
   });

   test("demoSwitch covers case2", () => {
     expect(demoSwitch("case2")).toBe("Result for case 2");
   });

   test("demoSwitch covers case3", () => {
     expect(demoSwitch("case3")).toBe("Result for case 3");
   });
   ```

2. **Re-Run the Tests** (and Capture Coverage):

   With floating changes on your branch, run:

   ```sh
   bun run test:coverage
   ```

   This command will detect that coverage has increased (more switch cases are covered) and exit with code `0`.
