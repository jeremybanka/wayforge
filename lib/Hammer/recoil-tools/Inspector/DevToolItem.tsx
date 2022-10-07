import type { FC } from "react"

import { prettyPrintJson } from "pretty-print-json"
import type { RecoilValue } from "recoil"
import { atom, useRecoilState, useRecoilValue } from "recoil"
import styled from "styled-components"

import { recoilDevToolsOpenItemsState, recoilDevToolsSettingsState } from "."

const Atom = styled.pre<{ isOpen: boolean; itemSpacing: number }>`
  margin: 0;

  width: 100%;
  padding: ${({ itemSpacing }) => itemSpacing}px 10px;
  font-size: 17px;
  display: inline-block;
  justify-self: flex-end;
  color: ${({ theme, isOpen }) =>
    isOpen ? theme.primaryText : theme.faintText};
  .recoilToolDetail {
    cursor: pointer;
    user-select: none;
  }
  pre {
    width: 1000px;
  }
  .devHeadingContainer {
    left: 0px;
    top: 0px;
    border-radius: 20px;
    position: sticky;
    width: fit-content;
    backdrop-filter: blur(10px);
    padding: 0 5px;
    display: inline-block;
    h1 {
      display: inline;
      font-size: 17px;
      margin: 5px 0;
      flex-shrink: 0;
      cursor: pointer;
      user-select: none;
    }
  }
`

const parseParamToJson = (param: string) => {
  let parsable = param
  if (param === undefined) {
    return ``
  }
  if (param[0] === `"`) {
    parsable = param.slice(1, -1)
  }
  // else {
  //   const [identifier, innerParam] = param.split(`/`)
  //   parsable = JSON.parse(innerParam)
  // }
  return prettyPrintJson.toHtml(parsable)
}

// const AUTO_SHOW_ITEMS = [`edge`, `area`, `panel`, `node`, `edgeComputed`]

const DevToolItem: FC<{
  node: RecoilValue<unknown>
  param: string
  data: JSON
}> = ({ node, param, data }) => {
  const { itemSpacing } = useRecoilValue(recoilDevToolsSettingsState)
  const [openItems, setOpenItems] = useRecoilState(recoilDevToolsOpenItemsState)

  const key = node.key.split(`__`)[0]
  if (openItems[node.key] === undefined) {
    setOpenItems((prev) => ({
      ...prev,
      [node.key]: data !== Object(data) && data !== null,
    }))
  }
  const isOpen = openItems[node.key] === true
  const setIsOpen = () => {
    setOpenItems((prev) => ({
      ...prev,
      [node.key]: !prev[node.key],
    }))
  }
  return (
    <Atom key={node.key} isOpen={isOpen} itemSpacing={itemSpacing}>
      <div className="devHeadingContainer">
        <h1 onClick={setIsOpen}>
          {key}
          {isOpen && `: `}
        </h1>
      </div>
      {param && (
        <span onClick={setIsOpen} className="recoilToolDetail">
          <output
            dangerouslySetInnerHTML={{
              __html: parseParamToJson(param),
            }}
          />
          <span>{`: `}</span>
        </span>
      )}
      {isOpen && (
        <output
          dangerouslySetInnerHTML={{
            __html: prettyPrintJson.toHtml(data, { indent: 2 }),
          }}
        />
      )}
    </Atom>
  )
}

export default DevToolItem
