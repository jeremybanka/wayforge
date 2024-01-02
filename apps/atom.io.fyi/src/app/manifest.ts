import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `AtomIO Documentation`,
		short_name: `AtomIO`,
		description: `Perfect state management for ECMAScript`,
		start_url: `/`,
		display: `minimal-ui`,
		background_color: `#ccc`,
		// icons: [
		// 	{
		// 		src: `/favicon.ico`,
		// 		sizes: `any`,
		// 		type: `image/x-icon`,
		// 	},
		// ],
	}
}
