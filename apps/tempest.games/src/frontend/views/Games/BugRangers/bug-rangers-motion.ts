import type { MotionAttributes } from "@atom.io/spa/motion"

export const turnBannerMotion = (
	[
		[`20vw`, `90vw`, `90vw`, `10vw`],
		[`20vw`, `20vw`, `100vw`, `10vw`],
		[`20vw`, `20vw`, `100vw`, `10vw`],
		[`20vw`, `80vw`, `80vw`, `10vw`],
	] as const
).map((width, index): MotionAttributes => ({
	"motion:animate": {
		x:
			index === 3
				? [`-1500%`, `5%`, `10%`, `1500%`]
				: index === 2
					? [`1500%`, `4%`, `2%`, `-1500%`]
					: [`-1500%`, `2%`, `4%`, `1500%`],
		skewX: [`-50deg`, `-5deg`, `-5deg`, `-50deg`],
		width,
	},
	"motion:transition": {
		duration: 3,
		times:
			index === 0
				? [0, 0.1, 0.77, 1]
				: index === 3
					? [0, 0.2, 0.75, 1]
					: [0, 0.1, 0.7, 1],
		ease: [`circOut`, `linear`, `easeIn`],
	},
}))
