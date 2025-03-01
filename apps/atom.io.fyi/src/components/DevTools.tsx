"use client"

import dynamic from "next/dynamic"

// This function checks if the component should be loaded
const shouldLoadComponent = () => {
	// Replace `process.env.NODE_ENV !== 'production'` with any specific condition
	// based on your environment variables or other logic to determine if this
	// is a development or a preview environment
	return process.env.NODE_ENV !== `production`
}

// Dynamically import the component only if shouldLoadComponent returns true
export const AtomIODevtools = dynamic(
	() =>
		shouldLoadComponent()
			? import(`atom.io/react-devtools`).then((mod) => mod.AtomIODevtools)
			: Promise.resolve(() => null),
	{
		ssr: false,
	},
)
