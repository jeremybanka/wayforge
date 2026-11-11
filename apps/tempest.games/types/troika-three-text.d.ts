// Troika is Drei's renderer-independent SDF text engine; it ships without types.
// eslint-disable-next-line quotes
declare module "troika-three-text" {
	import type { Mesh } from "three"

	export class Text extends Mesh {
		public text: string
		public fontSize: number
		public anchorX: string | number
		public anchorY: string | number
		public color: string
		public sdfGlyphSize: number
		public sync(callback?: () => void): void
		public dispose(): void
	}
}
