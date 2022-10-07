import { css } from "styled-components"

interface Theme {
  key: string
  string: string
  number: string
  boolean: string
  null: string
  mark: string
  link: string
  text: string
  primaryText: string
  faintText: string
  headerBackground: string
  faintOutline: string
  background: string
  iconBackground: string
}

export const devThemes: Record<string, Theme> = {
  "Light": {
    key: `blue`,
    string: `#333`,
    number: `blue`,
    boolean: `teal`,
    null: `red`,
    mark: `black`,
    link: `purple`,
    text: `grey`,
    primaryText: `black`,
    faintText: `#585858`,
    headerBackground: `#ffffff`,
    faintOutline: `#00000030`,
    background: `#ffffff`,
    iconBackground: `#dbdbdb`,
  },
  "Dark": {
    key: `indianred`,
    string: `darkkhaki`,
    number: `deepskyblue`,
    boolean: `mediumseagreen`,
    null: `darkorange`,
    mark: `silver`,
    link: `mediumorchid`,
    text: `#e2e2e2`,
    primaryText: `#e2e2e2`,
    faintText: `#a5a5a5`,
    headerBackground: `#000000`,
    faintOutline: `#ffffff32`,
    background: `#1b1b1b`,
    iconBackground: `#000000`,
  },
  "Github Light": {
    key: `#d73a49`,
    string: `#6f42c1`,
    number: `#005cc5`,
    boolean: `#005cc5`,
    null: `#005cc5`,
    mark: `#586069`,
    link: `#0366d6`,
    text: `#24292e`,
    primaryText: `#24292e`,
    faintText: `#586069`,
    headerBackground: `#f6f8fa`,
    faintOutline: `#e1e4e8`,
    background: `#ffffff`,
    iconBackground: `#e7e7e7`,
  },
  "Github Dark": {
    key: `#d2a8ff`,
    string: `#70c6f0`,
    number: `#ff7b72`,
    boolean: `#68c0ff`,
    null: `#68c0ff`,
    mark: `#c9d1d9`,
    link: `#c9d1d9`,
    text: `#c9d1d9`,
    primaryText: `#c9d1d9`,
    faintText: `#a5a5a5`,
    headerBackground: `#161b22`,
    faintOutline: `#30363d`,
    background: `#0d1117`,
    iconBackground: `#30363d`,
  },

  "Tokyo Nights": {
    key: `#f7768e`,
    string: `#9ece6a`,
    number: `#ff9e64`,
    boolean: `#ff9e64`,
    null: `#ff9e64`,
    mark: `#9aa5ce`,
    link: `#7aa2f7`,
    text: `#9aa5ce`,
    primaryText: `#c0caf5`,
    faintText: `#565f89`,
    headerBackground: `#1a1b26`,
    faintOutline: `#24283b`,
    background: `#1a1b26`,
    iconBackground: `#13141d`,
  },
  "Gruvbox": {
    key: `#fb4934`,
    string: `#b8bb26`,
    number: `#fabd2f`,
    boolean: `#fabd2f`,
    null: `#fabd2f`,
    mark: `#d3869b`,
    link: `#8ec07c`,
    text: `#ebdbb2`,
    primaryText: `#ebdbb2`,
    faintText: `#a89984`,
    headerBackground: `#282828`,
    faintOutline: `#3b3b3b`,
    background: `#282828`,
    iconBackground: `#1d1d1d`,
  },
  "Dracula": {
    key: `#ff79c6`,
    string: `#50fa7b`,
    number: `#f1fa8c`,
    boolean: `#f1fa8c`,
    null: `#f1fa8c`,
    mark: `#bd93f9`,
    link: `#8be9fd`,
    text: `#f8f8f2`,
    primaryText: `#f8f8f2`,
    faintText: `#6272a4`,
    headerBackground: `#282a36`,
    faintOutline: `#44475a`,
    background: `#282a36`,
    iconBackground: `#1d1e25`,
  },
  "Nord": {
    key: `#bf616a`,
    string: `#a3be8c`,
    number: `#ebcb8b`,
    boolean: `#ebcb8b`,
    null: `#ebcb8b`,
    mark: `#b48ead`,
    link: `#81a1c1`,
    text: `#d8dee9`,
    primaryText: `#d8dee9`,
    faintText: `#7d879c`,
    headerBackground: `#2e3440`,
    faintOutline: `#3b4252`,
    background: `#2e3440`,
    iconBackground: `#3b4252`,
  },
  "Solarized Light": {
    key: `#dc322f`,
    string: `#2aa198`,
    number: `#b58900`,
    boolean: `#b58900`,
    null: `#b58900`,
    mark: `#268bd2`,
    link: `#268bd2`,
    text: `#657b83`,
    primaryText: `#657b83`,
    faintText: `#586e75`,
    headerBackground: `#fdf6e3`,
    faintOutline: `#eee8d5`,
    background: `#fdf6e3`,
    iconBackground: `#eee8d5`,
  },
  "Solarized Dark": {
    key: `#dc322f`,
    string: `#2aa198`,
    number: `#b58900`,
    boolean: `#b58900`,
    null: `#b58900`,
    mark: `#268bd2`,
    link: `#268bd2`,
    text: `#839496`,
    primaryText: `#839496`,
    faintText: `#93a1a1`,
    headerBackground: `#002b36`,
    faintOutline: `#073642`,
    background: `#002b36`,
    iconBackground: `#073642`,
  },
}

export const JsonColors = css`
  ::-webkit-scrollbar {
    width: 8px;
    height: 0;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.faintOutline};
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.faintText};
  }
  ::-webkit-scrollbar-corner {
    background: ${({ theme }) => theme.background};
  }

  .json-key {
    color: ${({ theme }) => theme.key};
  }
  .json-string {
    color: ${({ theme }) => theme.string};
  }
  .json-number {
    color: ${({ theme }) => theme.number};
  }
  .json-boolean {
    color: ${({ theme }) => theme.boolean};
  }
  .json-null {
    color: ${({ theme }) => theme.null};
  }
  .json-mark {
    color: ${({ theme }) => theme.mark};
  }
  .json-link {
    color: ${({ theme }) => theme.link};
  }
`
