import type { ReactElement } from "react"

type IconProps = {
	fill?: string
	stroke?: string
	strokeWidth?: number
	strokeMiterlimit?: number
}

export function tile({
	fill = `none`,
	stroke = `black`,
	strokeWidth = 1,
	strokeMiterlimit = 10,
}: IconProps): ReactElement {
	return (
		<svg
			id="uuid-55af1f58-4ded-4edb-a44d-2a28837a648d"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 142 142"
		>
			<title>icon representing a tile</title>
			<polygon
				points="86.53 13.04 28.57 26.97 13.04 78.94 55.47 116.99 113.43 103.06 128.96 51.09 86.53 13.04"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
			<polygon
				points="86.53 27.06 28.57 40.98 13.04 92.95 55.47 131 113.43 117.07 128.96 65.1 86.53 27.06"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
			<line
				x1="13.04"
				y1="78.94"
				x2="13.04"
				y2="92.95"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
			<line
				x1="128.96"
				y1="65.1"
				x2="128.96"
				y2="51.09"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
		</svg>
	)
}
export function cube({
	fill = `none`,
	stroke = `black`,
	strokeWidth = 1,
	strokeMiterlimit = 10,
}: IconProps): ReactElement {
	return (
		<svg
			id="uuid-d0d5f6c5-fe00-4880-9c8d-d1bebac5afc6"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 142 142"
		>
			<title>icon representing a cube</title>
			<polygon
				points="106.74 37.53 18.72 34.44 18.72 119.48 106.74 122.57 106.74 37.53"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
			<polygon
				points="122.88 19.92 39.58 16.97 39.58 98.05 122.88 101 122.88 19.92"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
			<line
				x1="18.72"
				y1="34.44"
				x2="39.58"
				y2="16.97"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
			<line
				x1="106.74"
				y1="122.57"
				x2="122.88"
				y2="101"
				style={{ fill, stroke, strokeWidth, strokeMiterlimit }}
			/>
		</svg>
	)
}
