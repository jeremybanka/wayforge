import type { Json } from "../json"
import type { Link, Links } from "./document"

export type ErrorObject_Optional<
	META extends Json.Serializable | undefined = undefined,
> = {
	id?: string
	links?:
		| (Links & {
				about: Link | string
		  })
		| undefined
	status?: string
	code?: string
	title?: string
	detail?: string
	source?: unknown
	meta?: META
}

export type ErrorKey = keyof ErrorObject_Optional

/* prettier-ignore */
export type ErrorObject<
	REQUIRED extends ErrorKey | undefined = undefined,
	META extends Json.Serializable | undefined = undefined,
> = (REQUIRED extends ErrorKey
	? {
			[KEY in REQUIRED]-?: Pick<ErrorObject_Optional<META>, KEY>[KEY]
	  }
	: ErrorObject_Optional<META>) & {
	type: `error`
}
