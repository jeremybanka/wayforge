// @ts-check
import eslint from '@eslint/js';
import tslint from 'typescript-eslint';

export default tslint.config(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  eslint.configs.recommended,
  ...tslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        `error`,
        {
          fixStyle: `separate-type-imports`,
          prefer: `type-imports`, 
        },
      ],
      "@typescript-eslint/explicit-member-accessibility": `error`,
      "@typescript-eslint/explicit-module-boundary-types": `error`,
      "@typescript-eslint/no-explicit-any": `off`,
      "@typescript-eslint/no-unsafe-argument": `off`,
      "@typescript-eslint/no-unsafe-assignment": `off`,
      "@typescript-eslint/no-unsafe-member-access": `off`,
      "@typescript-eslint/no-unsafe-return": `off`,
      "@typescript-eslint/no-unused-vars": `off`,
      "@typescript-eslint/prefer-enum-initializers": `error`,
      "@typescript-eslint/prefer-literal-enum-member": `error`,
      "@typescript-eslint/prefer-optional-chain": `error`,
      "@typescript-eslint/sort-type-constituents": `error`,
      "@typescript-eslint/type-annotation-spacing": `error`,
      "@typescript-eslint/unified-signatures": `error`,
  
      "no-mixed-spaces-and-tabs": `off`,
      "quotes": [`error`, `backtick`],
      "quote-props": [`error`, `consistent`, { unnecessary: false }],
    }
  },
)