<hr>

<div align="center">
  <img alt="corners logo" src="https://raw.githubusercontent.com/jeremybanka/wayforge/main/packages/atom.io/assets/logo.png"/>
</div>

<br>

<p align="center">
  <a href="https://bundlephobia.com/result?p=atom.io">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/atom.io?style=for-the-badge&labelColor=333">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/atom.io">
    <img alt="Types" src="https://img.shields.io/npm/types/atom.io?style=for-the-badge&labelColor=333">
  </a>
  <a aria-label="Build status" href="https://github.com/jeremybanka/wayforge/actions/workflows/integration.yml">
    <img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/jeremybanka/wayforge/integration.yml?branch=main&style=for-the-badge&labelColor=333">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/atom.io">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/atom.io?style=for-the-badge&labelColor=333">
  </a>
</p>

```shell
npm i atom.io
```
```shell
pnpm i atom.io
```
```shell
bun i atom.io
```
<hr>

Fine-grained reactivity for JavaScript environments.

💙 Inspired by [Recoil](https://recoiljs.org/).

# Usage

```typescript
import { atom } from 'atom.io'

const countState = atom({
  key: 'count',
  default: 0
}) 
   // { key: 'count', type: 'atom' }


```
