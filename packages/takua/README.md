# takua

```sh
npm i takua
```

Takua is a chronicler. A nice logger with colors and timestamps.

```ts
import { Logger } from "takua"

const logger = new Logger({
	colorEnabled: false,
	sink: {
		error: (message) => connection.console.error(message),
		info: (message) => connection.console.info(message),
		log: (message) => connection.console.log(message),
		warn: (message) => connection.console.warn(message),
	},
})
```

Use a sink when stdout is reserved for another transport, such as an LSP,
JSON-RPC process, worker runtime, or test harness. Chronicle output uses the
same sink.
