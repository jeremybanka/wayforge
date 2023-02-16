//       /    ¯¯¯¯|                                                         \/
//     /          |                                                        /  \
//   /            |      ¯¯¯¯¯¯\     /¯¯¯¯¯\    /¯¯¯¯¯\  ¯¯¯|/¯¯¯¯\      /      \
//   \            |        ___  |   |_______   |_______|    |          /        /
//     \          |      /     \            |  |            |        /        /
//       \         \__   \_____/\_  \______/    \______     |      /        /

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >
  }
}
