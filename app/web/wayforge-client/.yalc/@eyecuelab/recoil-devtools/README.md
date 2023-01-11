# Recoil Devtools

[![npm version](https://badge.fury.io/js/@eyecuelab%2Frecoil-devtools.svg)](https://badge.fury.io/js/@eyecuelab%2Frecoil-devtools)
![NPM Downloads](https://img.shields.io/npm/dw/@eyecuelab/recoil-devtools)

[Live Demo](https://joshwrn.github.io/recoil-devtools/)

# Install

```bash
# yarn
yarn add --dev @eyecuelab/recoil-devtools

#npm
npm install --save-dev @eyecuelab/recoil-devtools
```

# Usage

```tsx
import { RecoilInspector } from "@eyecuelab/recoil-devtools"

const App = () => {
  return (
    <RecoilRoot>
      <React.StrictMode>
        <RecoilInspector />
      </React.StrictMode>
    </RecoilRoot>
  )
}
```
