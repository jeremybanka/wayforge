"use client"
import * as React from "react"
import * as nav from "./<nav>"
import scss from "./layout.module.scss"

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode
}): JSX.Element {
	return (
		<article className={scss.class}>
			<nav.Contents />
			<main>{children}</main>
		</article>
	)
}
