import type { ISO8601 } from "./time"
import { instant, iso8601 } from "./time"

test(`lossless transformation between ISO8601 and Temporal.Instant`, () => {
	const isoString = `2023-07-01T00:00:00.000Z` as ISO8601
	const inst = instant(isoString)
	expect(iso8601(inst)).toBe(isoString)
})
