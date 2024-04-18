import "./code.scss"
import "./globals.scss"

import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"

import scss from "./layout.module.scss"
import Realtime from "./Realtime"
import { Theme } from "./Theme"

export const metadata: Metadata = {
	title: `Wayfarer`,
	description: `Tempest Games Prototype.`,
	appleWebApp: {
		capable: true,
		title: `Cards`,
		statusBarStyle: `black-translucent`,
	},
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
				<main>
					<Realtime>{children}</Realtime>
				</main>
				<footer />
				<Analytics />
			</body>
		</html>
	)
}
