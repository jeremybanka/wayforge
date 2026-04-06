// eslint-disable-next-line quotes
declare module "*.module.css" {
	const css: { class: string; [key: string]: string }
	export default css
}
