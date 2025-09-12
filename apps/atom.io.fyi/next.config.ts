import nextMDX from "@next/mdx"
import type { NextConfig } from "next"

const nextConfig = {
	distDir: `dist`,
	pageExtensions: [`ts`, `tsx`, `js`, `jsx`, `md`, `mdx`],
	reactStrictMode: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
} satisfies NextConfig

const withMDX = nextMDX({
	extension: /\.mdx?$/,
	options: {
		rehypePlugins: [`rehype-slug`],
	},
})

export default withMDX(nextConfig)
