import { Hono } from "hono"

export const assetsRoutes = new Hono()

function Diagonal(): JSX.Element {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: graphic
		<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg">
			<line x1="0" y1="0" x2="2048" y2="2048" stroke="#000" stroke-width="512" />
		</svg>
	)
}

assetsRoutes.get(`/diagonal.svg`, (c) => {
	c.header(`Content-Type`, `image/svg+xml`)
	return c.body(Diagonal())
})

function Dots(): JSX.Element {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: graphic
		<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg">
			<circle cx="1024" cy="1024" r="1024" fill="#000" />
		</svg>
	)
}

assetsRoutes.get(`/dots.svg`, (c) => {
	c.header(`Content-Type`, `image/svg+xml`)
	return c.body(Dots())
})
