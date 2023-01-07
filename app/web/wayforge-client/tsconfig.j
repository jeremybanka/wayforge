{
  "extends": "../../../tsconfig.web.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@emotion/react"
  },
  "include": ["src"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx", "**/*.config.ts"]
}
