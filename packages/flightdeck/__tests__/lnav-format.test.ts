import { lnavFormatSchema } from "../gen/lnav-format-schema.gen.ts"
import { FLIGHTDECK_LNAV_FORMAT } from "../src/lib.ts"

test(`flightdeck ships a valid lnav format for its logger`, () => {
	lnavFormatSchema.parse(FLIGHTDECK_LNAV_FORMAT)
})
