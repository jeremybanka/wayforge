import { ChamferedTop } from "./corners/factories"

export const span = {
	chamferedTop: ChamferedTop(`span`, {
		useClipPath: false,
		below: [
			{
				color: `#ccc`,
			},
		],
	}),
}
