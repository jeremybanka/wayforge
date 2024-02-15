import type { VNode } from "preact"
import * as svg from "./<svg>"

export function layout(props: { children: any }): VNode {
	return (
		<>
			<header>
				<svg.tempest />
			</header>
			<main>{props.children}</main>
			<footer>
				<p>&copy; 2024</p>
			</footer>
		</>
	)
}
