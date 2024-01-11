import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `Wayfarer`,
		short_name: `Wayfarer`,
		description: `Delve into the world of Wayfarer`,
		start_url: `/`,
		display: `standalone`,
	}
}
