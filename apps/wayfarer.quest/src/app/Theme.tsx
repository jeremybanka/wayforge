"use client"

import * as React from "react"

function updateThemeColor() {
	const themeColor = getComputedStyle(document.documentElement)
		.getPropertyValue(`--bg-darkest`)
		.trim()
	const metaThemeColor = document.querySelector(`meta[name="theme-color"]`)
	if (metaThemeColor) {
		metaThemeColor.setAttribute(`content`, themeColor)
	} else {
		console.warn(`No meta[name="theme-color"]`)
		const meta = document.createElement(`meta`)
		meta.setAttribute(`name`, `theme-color`)
		meta.setAttribute(`content`, themeColor)
		document.head.appendChild(meta)
	}
	const metaBackgroundColor = document.querySelector(
		`meta[name="background-color"]`,
	)
	if (metaBackgroundColor) {
		metaBackgroundColor.setAttribute(`content`, themeColor)
	} else {
		console.warn(`No meta[name="background-color"]`)
		const meta = document.createElement(`meta`)
		meta.setAttribute(`name`, `background-color`)
		meta.setAttribute(`content`, themeColor)
		document.head.appendChild(meta)
	}
}

export function Theme(): null {
	React.useEffect(() => {
		updateThemeColor()
		const matcher = window.matchMedia(`(prefers-color-scheme: dark)`)
		matcher.addEventListener(`change`, updateThemeColor)
		return () => matcher.removeEventListener(`change`, updateThemeColor)
	}, [])
	return null
}
