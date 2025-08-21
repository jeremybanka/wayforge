// Types for JSON-safe data
type JSONValue = JSONArray | JSONObject | boolean | number | string | null
interface JSONObject {
	[k: string]: JSONValue
}
type JSONArray = Array<JSONValue>

interface ErrorAsJSON {
	name: string // "Error", "TypeError", "MyCustomError", ...
	message: string
	stack?: string // stringified stack
	cause?: ErrorAsJSON // nested cause
	errors?: ErrorAsJSON[] // for AggregateError
	props?: JSONObject // extra own enumerable props (JSON-safe only)
}

// Pick which built-ins you want to reconstruct specially
const ctorByName: Record<
	string,
	new (
		message?: string,
		options?: { cause?: unknown },
	) => Error
> = {
	Error,
	TypeError,
	RangeError,
	ReferenceError,
	SyntaxError,
	URIError,
	EvalError,
	AggregateError: AggregateError as unknown as new (
		message?: string,
		options?: { cause?: unknown },
	) => Error,
}

// Safely convert arbitrary values to JSON-safe shapes (drop functions/symbols/BigInt, avoid cycles)
function toJSONSafe(value: unknown, seen = new WeakSet()): JSONValue {
	if (
		value === null ||
		typeof value === `string` ||
		typeof value === `number` ||
		typeof value === `boolean`
	) {
		return value
	}
	if (Array.isArray(value)) {
		if (seen.has(value as object)) return null
		seen.add(value as object)
		return value.map((v) => toJSONSafe(v, seen)) as JSONArray
	}
	if (typeof value === `object`) {
		if (!value) return null
		if (seen.has(value)) return null
		seen.add(value)
		const out: JSONObject = {}
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			const converted = toJSONSafe(v, seen)
			if (converted !== undefined) out[k] = converted
		}
		return out
	}
	// drop functions, symbols, bigints, undefined
	return null
}

export function errorToJSON(error: Error): ErrorAsJSON {
	const payload: ErrorAsJSON = {
		name: error.name || `Error`,
		message: error.message || ``,
	}
	if (`stack` in error) {
		payload.stack = error.stack
	}
	if (error.cause instanceof Error) {
		payload.cause = errorToJSON(error.cause)
	}
	if (typeof AggregateError !== `undefined` && error instanceof AggregateError) {
		const items = Array.from(error.errors ?? [])
		payload.errors = items.map(errorToJSON)
	}

	// Extra own, enumerable props (filter out the ones we already captured)
	const props: Record<string, unknown> = {}
	for (const key of Object.keys(error)) {
		if (
			key === `name` ||
			key === `message` ||
			key === `stack` ||
			key === `cause` ||
			key === `errors`
		)
			continue
		props[key] = (error as any)[key]
	}
	const jsonProps = toJSONSafe(props)
	if (jsonProps && typeof jsonProps === `object`) {
		payload.props = jsonProps as JSONObject
	}

	return payload
}

export type StringifiedError = `ERROR!\n${string}`
export function stringifyError(error: Error): StringifiedError {
	const payload = errorToJSON(error)
	const stringifiedPayload = JSON.stringify(payload, null, `\t`)
	return `ERROR!\n${stringifiedPayload}`
}

export function parseError(stringifiedError: StringifiedError): Error
export function parseError(maybeStringifiedError: string): Error | undefined
export function parseError(maybeStringifiedError: string): Error | undefined {
	if (!maybeStringifiedError.startsWith(`ERROR!\n`)) return undefined

	const stringifiedPayload = maybeStringifiedError.slice(`ERROR!\n`.length)
	const payload = JSON.parse(stringifiedPayload)

	const Ctor = ctorByName[payload.name] ?? Error

	// Rehydrate cause first so we can pass it into the constructor
	const causeErr = payload.cause ? parseError(payload.cause) : undefined

	// AggregateError needs special handling for `errors`; for others, just pass message/cause
	let err: Error
	if (Ctor === (AggregateError as unknown)) {
		const errs = (payload.errors ?? []).map(parseError)
		// Message displays differently across engines; set it explicitly too
		err = new (AggregateError as any)(errs, payload.message, { cause: causeErr })
	} else {
		err = new Ctor(payload.message, { cause: causeErr })
	}

	// Preserve the original name if it was custom
	if (!(payload.name in ctorByName)) {
		try {
			err.name = payload.name
		} catch {
			/* ignore */
		}
	}

	// Restore stack as a non-enumerable property (common engine behavior)
	if (payload.stack) {
		try {
			Object.defineProperty(err, `stack`, {
				value: payload.stack,
				writable: true,
				configurable: true,
				enumerable: false,
			})
		} catch {
			// fallback: direct assignment (works in most environments)
			;(err as any).stack = payload.stack
		}
	}

	// Reattach extra props
	if (payload.props && typeof payload.props === `object`) {
		for (const [k, v] of Object.entries(payload.props)) {
			try {
				;(err as any)[k] = v
			} catch {
				/* ignore */
			}
		}
	}

	return err
}
