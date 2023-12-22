import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"

import { Theme } from "./Theme"

import "./code.scss"
import "./globals.scss"
import scss from "./layout.module.scss"

export const metadata: Metadata = {
	title: `Reactive Data • atom.io`,
	description: `Batteries-included data framework for any ECMAScript environment.`,
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}): JSX.Element {
	return (
		<html lang="en">
			<Theme />
			<body className={scss.class}>
				<header />
				<main>{children}</main>
				<footer />
				<Analytics />
			</body>
		</html>
	)
}
