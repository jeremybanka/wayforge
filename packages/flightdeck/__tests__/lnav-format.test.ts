import { lnavFormatSchema } from "../gen/lnav-format.zod"
import { FLIGHTDECK_LNAV_FORMAT } from "../src/lib"

test(`flightdeck ships a valid lnav format for its logger`, () => {
	lnavFormatSchema.parse(FLIGHTDECK_LNAV_FORMAT)
})
