import * as React from "react"

import type { Pathname } from "./services/router-service"

export type AnchorProps = Omit<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	`href`
> & { href: Pathname }

export function Anchor(props: AnchorProps): React.ReactNode {
	return <a {...props} />
}
