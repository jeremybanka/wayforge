import type { Metadata } from "next"
import Link from "next/link"
import "./code.scss"
import "./globals.scss"
import scss from "./layout.module.scss"

export const metadata: Metadata = {
	title: `Pure Data • atom.io`,
	description: `Batteries-included data framework for any ECMAScript environment.`,
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}): JSX.Element {
	return (
		<html lang="en">
			<body className={scss.class}>
				<header>
					<nav>
						<Link href="/">atom.io.fyi</Link>
						<Link href="docs">docs</Link>
						<Link href="https://github.com/jeremybanka/wayforge/tree/main/packages/atom.io">
							github
						</Link>
					</nav>
				</header>
				<main>{children}</main>
				<footer>♥️ jeremybanka</footer>
			</body>
		</html>
	)
}
