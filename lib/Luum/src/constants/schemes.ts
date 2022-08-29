export const UI = {
  state: {
    hover: {},
    active: {},
    disabled: {},
  },
  bg: {
    shade: 24,
    state: {
      base: {},
      hover: { shade: 18 },
      active: { shade: 32 },
      disabled: { shade: 32 },
    },
  },
  mg: {
    shade: 48,
  },
  fg: {
    contrast: `soft`,
    state: {
      hover: { contrast: `harden` },
      active: { contrast: `harden` },
      disabled: { shade: 20 },
    },
  },
}

// Example:
/* ```
[
  [<component-name>, {
    'rootColor': [],
    'variables': [],
    'children': [<recurse>]
  }],
  []
]

// transforms: shade, tint, contrast, sat, lum, hue

```
*/

export const trifactory = {
  PaletteModule: {
    contextColor: [{ resetColor: `#fee` }, { shade: 20 }],
    /*
    // NOTE: These state changes are localized to the current
    // object, and have no impact on children.
    states: {
      hover: [{tint: 10}, {shade: 22}],
    },
    */
    // NOTE: these variables get included into each child
    // as ex-<variable-name>
    variables: {
      bg: [],
      mg: [{ resetColor: 1 }, { shade: 10 }],
      fg: [{ contrast: `soft` }],
    },
    children: {
      Control: {
        // NOTE: All these colors start with the contextColor
        // and not with the ex-color from parent
        states: {
          base: {},
          hover: [{ tint: 12 }],
          active: [{ shade: 18 }],
        },
        variables: {
          bg: [{ shade: 24 }],
          mg: [{ shade: 48 }],
          fg: {
            // NOTE: All these colors start with a context of the
            // existing state of the parent.
            states: {
              base: [{ shade: 24 }, { contrast: `soft` }],
              hover: [{ shade: 24 }, { contrast: `soft` }],
              active: [{ shade: 24 }, { contrast: `hard` }],
            },
          },
        },
      },
    },
  },
}

// color scheme  ->           = CSS stylesheet
// color palette -> component = CSS scope
// color element -> role      = CSS variable
// color state   ->             CSS pseudo-class

// factored ops -> nested hex lists -> compiled form (CSS)
// scheme       -> palette set      -> package

// ops
// _ PaletteName   // use
// _ transformation
// _ input > state
// _ el

/* scheme

*/

// palettes
export const palettes = [
  {
    id: `PaletteName`,
    hex: `#f00`,
    states: [
      {
        id: `base`,
        hex: `#f00`,
        elements: [
          { id: `bg`, hex: `#f00` },
          { id: `mg`, hex: `#f00` },
          { id: `fg`, hex: `#f00` },
        ],
      },
      {
        id: `hover`,
        hex: `#f00`,
        elements: [
          { id: `bg`, hex: `#f00` },
          { id: `mg`, hex: `#f00` },
          { id: `fg`, hex: `#f00` },
        ],
      },
    ],
  },
]

/*
const colorSchema = {
  exfg: colorContext.softContrast,
  exbg: hex,
  fg: {
    base: colorContext.softContrast,
    hover: colorContext.softContrast,
    active: colorContext.hardContrast,
    disable: a,
  },
  mg: [20, 15, 25].map(n => shade(n)),
  bg: [10, 5, 15].map(n => shade(n)),
}

const stylesheet = `
a
`
*/
