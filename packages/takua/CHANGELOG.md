# takua

## 0.2.1

### Patch Changes

- 7a2d506: Use Node's built-in `styleText` for terminal colors instead of depending on `picocolors`.

## 0.2.0

### Minor Changes

- 882df63: Restrict logger methods to a single data argument instead of accepting any number of trailing data arguments. Callers that need to log multiple values should wrap them in an array or object.

  This gives Takua clearer call-site typing and more predictable log output, while still preserving the ability to distinguish an omitted data value from intentionally logging `undefined`.

  For example, a higher-level logger can compose a consistent prefix while preserving its optional local `datum` parameter:

  ```ts
  import takua, { INTENTIONALLY_LEFT_BLANK } from "takua";

  function createAnalysisLogger(...context: string[]) {
    return {
      info(status: string, message: string, datum?: unknown) {
        takua.info(
          [...context, status].join(`:`),
          message,
          datum === undefined ? INTENTIONALLY_LEFT_BLANK : datum,
        );
      },
    };
  }
  ```

  That lets callers keep writing through `createAnalysisLogger("build", "types")`, without the wrapper accidentally turning "no datum was provided" into "please log `undefined`."

## 0.1.1

### Patch Changes

- 619f89e: ✨ Keep `chronicle` as state.

## 0.1.0

### Minor Changes

- 9b8aff4: ✨ Add `Logger.chronicle()` method for timing things that should run fast.
