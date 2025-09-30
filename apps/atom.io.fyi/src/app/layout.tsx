import "./code.scss"
import "./globals.scss"

import fs from "node:fs"

import type { Metadata } from "next"
import Link from "next/link"
import * as React from "react"

import { ATOM_IO_ROOT } from "../../../../packages/atom.io/__scripts__/constants"
import { AtomIODevtools } from "../components/Devtools"
import scss from "./layout.module.scss"
import { Theme } from "./Theme"

const packageJsonText = fs.readFileSync(`${ATOM_IO_ROOT}/package.json`, `utf-8`)
const packageJson = JSON.parse(packageJsonText)

export const metadata: Metadata = {
	title: `Reactive Data • atom.io`,
	description: `Batteries-included data framework for any ECMAScript environment.`,
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}): React.ReactNode {
	return (
		<html lang="en">
			<Theme />
			<body className={scss[`class`]}>
				<header>
					<nav>
						<section>
							<Link href="/">atom.io.fyi</Link>
						</section>
						<span className="gap" />
						<section>
							<Link href="/docs">docs</Link>
							<Link href="https://github.com/jeremybanka/wayforge/tree/main/packages/atom.io">
								github
							</Link>
						</section>
					</nav>
				</header>
				<aside>
					<span>🕊️ Free Palestine 🇵🇸</span>
				</aside>
				<main>{children}</main>
				<footer>
					<span>
						<code>{packageJson.version}</code>
					</span>
					<span>♥️ jeremybanka</span>
				</footer>
				<AtomIODevtools />
			</body>
		</html>
	)
}
