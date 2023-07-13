import { z } from "zod"

export default z
	.object({
		id: z.string().describe("The unique identifier of the energy."),
		name: z.string().describe("The unique name of this energy."),
		colorA: z
			.object({
				hue: z.number().describe("The hue of the color."),
				sat: z.number().describe("The saturation of the color."),
				lum: z.number().describe("The luminosity of the color."),
				prefer: z
					.enum(["sat", "lum"])
					.describe("Which is more important when rendering this color."),
			})
			.describe(
				"The main color of the energy, the color of its icon and the seed for the background of its cards.",
			),
		colorB: z
			.object({
				hue: z.number().describe("The hue of the color."),
				sat: z.number().describe("The saturation of the color."),
				lum: z.number().describe("The luminosity of the color."),
				prefer: z
					.enum(["sat", "lum"])
					.describe("Which is more important when rendering this color."),
			})
			.describe(
				"The accent color of the energy, which contrasts against colorA. Used for the Icon background and some text/borders on cards.",
			),
		icon: z.string().describe("The code for the icon in Delve System."),
	})
	.describe("A flavor of stuff in the world.")
