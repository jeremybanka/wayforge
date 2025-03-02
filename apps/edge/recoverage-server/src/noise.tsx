export function Noise(): JSX.Element {
	return (
		<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg" id="noise">
			<title>Noise</title>
			<filter id="noiseFilter">
				<feTurbulence
					type="fractalNoise"
					baseFrequency="0.65"
					numOctaves="3"
					stitchTiles="stitch"
				/>
			</filter>

			<rect
				width="100%"
				height="100%"
				filter="url(#noiseFilter)"
				fill-opacity="0.5"
			/>
		</svg>
	)
}
