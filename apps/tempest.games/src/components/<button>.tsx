import { motion } from "framer-motion"
import type { ButtonHTMLAttributes } from "react"

import { CurledLeft } from "./corners/factories"
import { LAYER } from "./corners/layers"
import flashFire from "./flashfire.module.scss"

const FlashFire = CurledLeft(motion.button, {
	useClipPath: false,
	below: [LAYER.FG_STROKE],
})

export const button = {
	ff: (props: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element => (
		<FlashFire {...props} className={flashFire.class} />
	),
}
