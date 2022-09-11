import type { FC } from "react"

import { css } from "@emotion/react"
import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import energySchema from "~/app/wayforge-server/projects/wayfarer/schema/energy.schema.json"
import type { JsonSchema } from "~/lib/json/json-schema"
import type { LuumCssRule } from "~/lib/Luum"
import { luumToCss } from "~/lib/Luum"
import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"
import { JsonEditor } from "~/lib/react-ui/json-editor"

import type { Energy } from "../../services/energy"

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  unlink: () => void
}

export const EnergyIcon: FC<{ energy: Energy }> = ({ energy }) => {
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`fill`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`fill`, []],
  }

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)

  return (
    <g>
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="white"
        css={css`
          ${scssB};
        `}
      />
      <text
        x="24"
        y="63"
        css={css`
          font-family: "|_'_|";
          font-size: 45px;
          ${scssA};
        `}
      >
        {energy.icon}
      </text>
    </g>
  )
}

export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
  id,
  findState,
  unlink,
}) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
    // id: (id: string) => setEnergy((e) => ({ ...e, id })),
    // icon: (icon: string) => setEnergy((e) => ({ ...e, icon })),
  }

  return (
    <li
      css={css`
        border: 2px solid #333;
        padding: 20px;
      `}
    >
      <RecoverableErrorBoundary>
        <EnergyIcon energy={energy} />
      </RecoverableErrorBoundary>
      <JsonEditor
        schema={energySchema as JsonSchema}
        data={energy}
        set={setEnergy}
        name={energy.name}
        rename={set.name}
        remove={unlink}
        isReadonly={(path) => path.includes(`id`)}
        customCss={css`
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
            border: none;
            color: #777;
            @media (prefers-color-scheme: light) {
              color: #999;
            }
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
            input {
              color: #999;
              @media (prefers-color-scheme: light) {
                color: #777;
              }
            }
          }
          .json_editor_object {
            border-left: 2px solid #333;
            padding-left: 20px;
            @media (prefers-color-scheme: light) {
              border-color: #ccc;
            }
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
    </li>
  )
}
