/** @type {import('next').NextConfig} */
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
}


export default nextConfig
