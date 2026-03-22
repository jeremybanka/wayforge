/* eslint-disable quotes */
import type * as SolidJs from "solid-js"

declare module "solid-js" {
	namespace JSX {
		interface IntrinsicElements {
			[tagname: string]: SolidJs.JSX.HTMLAttributes<HTMLDivElement>
		}
	}
}
