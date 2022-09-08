import type { FC } from "react"

import { css } from "@emotion/react"
import Ajv from "ajv/dist/core"
import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import energySchema from "~/app/wayforge-server/projects/wayfarer/schema/energy.schema.json"
import type { JsonSchema } from "~/lib/json/json-schema"
import type { LuumCssRule } from "~/lib/Luum"
import { luumToCss } from "~/lib/Luum"
import { JsonEditor } from "~/lib/react-ui/json-editor"
import { TextInput } from "~/lib/react-ui/text-input"

import { findEnergyColorState } from "../../services/energy"
import type { Energy } from "../../services/energy"
import { EnergyColorPicker } from "./EnergyColorPicker"

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  unlink: () => void
}

export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
  id,
  findState,
  unlink,
}) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    id: (id: string) => setEnergy((e) => ({ ...e, id })),
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
    icon: (icon: string) => setEnergy((e) => ({ ...e, icon })),
  }
  /*
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`color`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`background-color`, []],
  }

  const colorAState = findEnergyColorState({ id, colorKey: `colorA` })
  const colorBState = findEnergyColorState({ id, colorKey: `colorB` })

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)
  const scss = css`
    ${scssA};
    ${scssB};
  `
  */
  // const schemeIsInteractive = isInteractiveScheme(colorScheme)
  // const palette = mixPaletteStatic(colorScheme)
  // const paletteIsInteractive = isInteractivePalette(palette)
  // const dec = paletteToScssDeclaration(palette, 0)
  // console.log({ scssA, scssB })

  return (
    <li>
      <JsonEditor
        Header={() => (
          <header>
            <TextInput value={energy.name} set={set.name} autoSize={true} />
          </header>
        )}
        remove={unlink}
        data={energy}
        set={setEnergy}
        schema={energySchema as JsonSchema}
        isReadonly={(path) => path.includes(`id`)}
        customCss={css`
          border: 2px solid #333;
          padding: 20px;
          input {
            font-size: 20px;
            font-family: theia;
            border: none;
            border-bottom: 1px solid;
            background: none;
            &:disabled {
              border: none;
            }
          }
          button {
            background: none;
            margin-left: auto;
            color: #777;
            border: none;
            font-family: theia;
            font-size: 14px;
            margin: none;
            padding: 4px;
            padding-bottom: 6px;
            cursor: pointer;
            &:hover {
              color: #333;
              background-color: #aaa;
            }
          }
          select {
            font-family: theia;
            font-size: 14px;
            background: none;
          }
          .json_editor_unofficial {
            background-color: #777;
            button {
              color: #333;
            }
          }
          .json_editor_missing {
            background-color: #f055;
          }
          .json_editor_key {
          }
          .json_editor_object {
            border-left: 2px solid #333;
            padding-left: 20px;
            .json_editor_properties {
              /* padding: 20px; */
              /* background-color: #8882; */
              > * {
                border-bottom: 2px solid #333;
                margin-bottom: 2px;
              }
            }
          }
        `}
      />
      {/* <span
        css={css`
          input {
            width: 100px;
            ${scss};
          }
        `}
      >
        <TextInput
          value={energy.icon}
          set={set.icon}
          placeholder="-"
          customCss={css`
            input {
              font-size: 54px;
              font-family: "|_'_|";
              text-align: center;
            }
          `}
        />

        <TextInput
          value={energy.icon}
          set={set.icon}
          placeholder="-"
          customCss={css`
            input {
              font-family: sudo;
              text-align: center;
            }
          `}
        />
      </span>
      <span>
        <TextInput
          label="name"
          value={energy.name}
          set={set.name}
          placeholder="-"
        />
        <TextInput label="id" value={energy.id} placeholder="-" />
      </span>
      <span>
        <EnergyColorPicker state={colorAState} />
        <EnergyColorPicker state={colorBState} />
      </span> */}

      <button onClick={unlink}>Unlink</button>
    </li>
  )
}
