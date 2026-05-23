# string interface

Source: docs/source/exhibits/web/string-interface.ts

```ts
type StringInterface<T> = {
	stringify: (t: T) => string
	parse: (s: string) => T
}
```
