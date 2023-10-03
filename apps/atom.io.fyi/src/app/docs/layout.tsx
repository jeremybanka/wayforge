import * as React from "react"
import * as nav from "./nav"

import type { Metadata } from "next"
import scss from "./layout.module.scss"

export const metadata: Metadata = {
	title: `Docs • atom.io`,
	description: `Batteries-included data framework for any ECMAScript environment.`,
}

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode
}): JSX.Element {
	return (
		<article className={scss.class}>
			<aside>
				<nav.SiteDirectory />
			</aside>
			<main>{children}</main>
			<aside data-user-toggle={false}>
				<nav.OnThisPage />
			</aside>
		</article>
	)
}
