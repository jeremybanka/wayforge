import React from "react"

import type { Pathname } from "./services/router-service"

export type AnchorProps = Omit<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	`href`
> & { href: Pathname }

export function Anchor(props: AnchorProps): JSX.Element {
	return <a {...props} />
}
