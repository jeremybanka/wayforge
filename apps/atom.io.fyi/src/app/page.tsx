import Head from "next/head"
import type { ReactNode } from "react"

import scss from "./page.module.scss"

export default function Home(): ReactNode {
	return (
		<>
			<Head>
				<link rel="preload" href="/noise.svg" as="image" type="image/svg+xml" />
			</Head>
			<main className={scss.class}>
				<h1>
					<span>atom</span>
					<span>.io</span>
				</h1>
				<section>
					Batteries-included data framework for any ECMAScript environment.
				</section>
			</main>
		</>
	)
}
