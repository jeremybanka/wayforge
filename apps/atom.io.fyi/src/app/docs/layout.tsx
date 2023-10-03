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
<<<<<<< HEAD
			<aside>
				<nav.SiteDirectory />
			</aside>
=======
>>>>>>> d1d0105b (✨ track navigation)
			<main>{children}</main>
			<aside>
				<nav.OnThisPage />
			</aside>
		</article>
	)
}
