import nextMDX from "@next/mdx"
import type { NextConfig } from "next"
import rehypeSlug from "rehype-slug"

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
		rehypePlugins: [rehypeSlug],
	},
})

export default withMDX(nextConfig)
