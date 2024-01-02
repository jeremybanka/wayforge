import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"

import { Theme } from "./Theme"

import Realtime from "./Realtime"
import "./code.scss"
import "./globals.scss"
import scss from "./layout.module.scss"

export const metadata: Metadata = {
	title: `Cards`,
	description: `Tempest Games Prototype.`,
	appleWebApp: {
		capable: true,
		title: `Cards`,
		statusBarStyle: `black-translucent`,
	},
	manifest: `./manifest.json`,
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
