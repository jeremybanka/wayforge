import nextMDX from '@next/mdx'
import rehypeSlug from 'rehype-slug'

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

/** @type {import('@next/mdx').withMDX} */
const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: [rehypeSlug]
  },
  // experimental: {
  //   mdxRs: true,
  // }
})
export default withMDX(nextConfig)
