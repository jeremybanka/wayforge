type SvgUrlData = {
	src: string
	blurHeight: number
	blurWidth: number
	height: number
	width: number
}

// eslint-disable-next-line quotes
declare module "*.svg?url" {
	const data: SvgUrlData
	export default data
}
