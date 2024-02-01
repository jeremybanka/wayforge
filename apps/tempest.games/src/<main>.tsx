import * as svg from "./<svg>"

export function layout(props: { children: any }): JSX.Element {
	return (
		<>
			<header>
				<svg.tempest />
			</header>
			<main>{props.children}</main>
			<footer>
				<p>© 2024</p>
			</footer>
		</>
	)
}
