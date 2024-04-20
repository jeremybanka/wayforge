import type { Metadata } from "next"
import * as React from "react"

import scss from "./layout.module.scss"
import * as nav from "./nav"
import Head from "next/head"

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
		<>
			<Head>
				<link rel="preload" href="/noise.svg" as="image" type="image/svg+xml" />
			</Head>
			<article className={scss.class}>
				<aside>
					<nav.SiteDirectory />
				</aside>
				<main>{children}</main>
				<aside>
					<nav.OnThisPage />
				</aside>
			</article>
		</>
	)
}
