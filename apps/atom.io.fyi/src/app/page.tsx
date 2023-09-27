"use client"

import scss from "./page.module.scss"

export default function Home(): JSX.Element {
	return (
		<main className={scss.class}>
			<h1>
				<span>atom</span>
				<span>.io</span>
			</h1>
			<section>
				Batteries-included data framework for any ECMAScript environment.
			</section>
		</main>
	)
}
