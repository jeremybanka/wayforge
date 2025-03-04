//       /    ¯¯¯¯|                                                         \/
//     /          |                                                        /  \
//   /            |      ¯¯¯¯¯¯\     /¯¯¯¯¯\    /¯¯¯¯¯\  ¯¯¯|/¯¯¯¯\      /      \
//   \            |        _____|   |_______   |_______|    |          /        /
//     \          |      /      |           |  |            |        /        /
//       \         \__   \____/ \_  \______/    \______     |      /        /

declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: React.DetailedHTMLProps<
			React.HTMLAttributes<HTMLDivElement>,
			HTMLDivElement
		>
	}
	type Element = JSX.Element
}
