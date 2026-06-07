import "react"

import type { ThreeElements } from "@react-three/fiber"

// eslint-disable-next-line quotes
declare module "react/jsx-runtime" {
	namespace JSX {
		// oxlint-disable-next-line typescript/no-empty-interface
		interface IntrinsicElements extends ThreeElements {}
	}
}
