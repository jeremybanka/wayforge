# varmint

<a aria-label="NPM version" href="https://www.npmjs.com/package/varmint">
	<img
		alt="NPM Version"
		src="https://img.shields.io/npm/v/varmint?style=for-the-badge"
	>
</a>
<!-- tonnage:default:start -->

## Bundle size

Public-module rows retain complete runtime export surfaces. Recipe rows bundle their reviewable entry files and tree-shake unused exports. Both report exact minified and level-9 gzip JavaScript byte counts; declarations, source maps, CSS, and other assets are excluded. Peer dependencies stay external, and shared modules are counted once per bundle.

### Public modules (whole export surface)

| Import               | Minified JS | Gzip JS |
| -------------------- | ----------: | ------: |
| <code>varmint</code> |    25,734 B | 8,737 B |

<!-- tonnage:default:end -->

```sh
npm i varmint
```

varmint is way to create automatic mocks for your tests by wrapping asynchronous functions in a caching layer.
