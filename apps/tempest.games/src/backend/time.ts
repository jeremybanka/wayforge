import { Temporal } from "@js-temporal/polyfill"

export type ISO8601 = string & { __brand: `ISO8601` }

export function iso8601(date: Temporal.Instant): ISO8601 {
	return date.toString({ smallestUnit: `millisecond` }) as ISO8601
}

export function instant(isoString: ISO8601): Temporal.Instant {
	return Temporal.Instant.from(isoString)
}
