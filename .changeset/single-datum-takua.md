---
"takua": minor
---

Restrict logger methods to a single data argument instead of accepting any number of trailing data arguments. Callers that need to log multiple values should wrap them in an array or object.

This gives Takua clearer call-site typing and more predictable log output, while still preserving the ability to distinguish an omitted data value from intentionally logging `undefined`.

For example, a higher-level logger can compose a consistent prefix while preserving its optional local `datum` parameter:

```ts
import takua, { INTENTIONALLY_LEFT_BLANK } from "takua"

function createAnalysisLogger(...context: string[]) {
	return {
		info(status: string, message: string, datum?: unknown) {
			takua.info(
				[...context, status].join(`:`),
				message,
				datum === undefined ? INTENTIONALLY_LEFT_BLANK : datum,
			)
		},
	}
}
```

That lets callers keep writing through `createAnalysisLogger("build", "types")`, without the wrapper accidentally turning "no datum was provided" into "please log `undefined`."
