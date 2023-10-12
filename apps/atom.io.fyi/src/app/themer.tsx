"use client"

import * as React from "react"

export function Theme(): JSX.Element | null {
	React.useEffect(() => {
		// const colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
		// 	? "dark"
		// 	: "light"
		// const metaThemeColor = document.querySelector('meta[name="theme-color"]')

		// if (colorScheme === "dark") {
		// 	metaThemeColor?.setAttribute("content", "black")
		// } else {
		// 	metaThemeColor?.setAttribute("content", "white")
		// }
		function updateThemeColor() {
			const themeColor = getComputedStyle(document.documentElement)
				.getPropertyValue(`--bg-shade-2`)
				.trim()
			const metaThemeColor = document.querySelector(`meta[name="theme-color"]`)
			if (metaThemeColor) {
				metaThemeColor.setAttribute(`content`, themeColor)
			}
		}
		const matcher = window.matchMedia(`(prefers-color-scheme: dark)`)

		matcher.addEventListener(`change`, updateThemeColor)

		return () => matcher.removeEventListener(`change`, updateThemeColor)
	}, [])
	return null
}
