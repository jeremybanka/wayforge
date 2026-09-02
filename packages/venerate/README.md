# venerate

<a aria-label="NPM version" href="https://www.npmjs.com/package/venerate">
	<img
		alt="NPM Version"
		src="https://img.shields.io/npm/v/treetrunks?style=for-the-badge"
	>
</a>
<a aria-label="Dependencies 0" href="https://www.npmjs.com/package/treetrunks">
	<img
		alt="Dependencies 0"
		src="https://img.shields.io/badge/dependencies-0-0?style=for-the-badge"
	>
</a>
```sh
npm i venerate
```

venerate is a small, pure library implementing venn diagram logic for iterables.

<!-- tonnage:default:start -->

## Bundle size

Public-module rows retain complete runtime export surfaces. Recipe rows bundle their reviewable entry files and tree-shake unused exports. Both report exact minified and level-9 gzip JavaScript byte counts; declarations, source maps, CSS, and other assets are excluded. Peer dependencies stay external, and shared modules are counted once per bundle.

### Public modules (whole export surface)

| Import                | Minified JS | Gzip JS |
| --------------------- | ----------: | ------: |
| <code>venerate</code> |     1,318 B |   572 B |

<!-- tonnage:default:end -->

## usage

```ts
import * as V from "venerate"

const a = [1, 2, 3]
const b = new Set([2, 3, 4])
const c = (function* () {
	yield 3
	yield 4
	yield 5
})()

const union = [...V.union(a, b, c)] // [1, 2, 3, 4, 5]
```
