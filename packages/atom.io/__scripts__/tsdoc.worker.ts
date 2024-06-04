import { advancedDemo } from "./tsdoc.lib"

declare const self: Worker

self.onmessage = ({ data }: MessageEvent) => {
	console.log(`📝 Extracting ${data}`)
	const foundComments = advancedDemo(data)

	self.postMessage(`Done`)
}
