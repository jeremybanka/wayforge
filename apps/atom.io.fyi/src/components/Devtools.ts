"use client"

import dynamic from "next/dynamic"

const shouldLoadComponent = () => {
	return process.env.NODE_ENV !== `production`
}

export const AtomIODevtools = dynamic(
	() =>
		shouldLoadComponent()
			? import(`./DevtoolsDynamic.tsx`).then((mod) => mod.AtomIODevtools)
			: Promise.resolve(() => null),
	{
		ssr: false,
	},
)
