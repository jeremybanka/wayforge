import config from "./sync.mts"
const foo = await Promise.resolve("hello world")
export default { ...config, foo }
