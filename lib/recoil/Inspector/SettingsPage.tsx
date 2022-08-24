import type { FC } from "react"

import { atom, useRecoilState, useSetRecoilState } from "recoil"
import styled from "styled-components"
// import { ReactComponent as BackArrow } from "@svg/tools/back-arrow.svg"

import { recoilDevToolsSettingsState } from "."
import { HANDLE_SIZE } from "./ResizableContainer"
import { devThemes } from "./themes"
/* eslint-disable max-lines */

const Container = styled.div<{ height: number; position: string }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  align-items: flex-start;
  overflow: auto;
  height: ${({ height, position }) =>
    position === `bottom` ? `${height}px` : `100vh`};
  max-height: ${({ position }) =>
    position === `bottom` ? `calc(100vh - ${HANDLE_SIZE}px)` : `100vh`};
  gap: 20px;
  .devSettingsTop {
    display: flex;
    align-items: center;
    width: 100%;
    border-bottom: 1px solid ${({ theme }) => theme.faintOutline};
    padding-bottom: 10px;
    div {
      display: flex;
      align-items: center;
      cursor: pointer;
      gap: 10px;
    }
    p {
      font-size: 20px;
      font-weight: 500;
      color: ${({ theme }) => theme.faintText};
    }
    svg {
      width: 20px;
      height: 20px;
      transform: translateY(1px);
    }
    path {
      fill: ${({ theme }) => theme.faintText};
    }
  }
`
const Option = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  border-bottom: 1px dashed ${({ theme }) => theme.faintOutline};
  padding: 5px 0;
  label {
    font-weight: 700;
    color: ${({ theme }) => theme.text};
  }
  select {
    color: ${({ theme }) => theme.faintText};
    font-weight: 600;
    cursor: pointer;
    padding-bottom: 5px;
  }
  option {
    background: ${({ theme }) => theme.background};
  }
  input,
  select {
    width: 50%;
    max-width: 400px;
    min-width: 135px;
  }
  input[type="range"] {
    cursor: pointer;
    margin-bottom: 20px;
    -webkit-appearance: none;
    border-radius: 20px;
    background: ${({ theme }) => theme.faintOutline};
    outline: 1px solid ${({ theme }) => theme.faintText}40;
    opacity: 0.7;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
    ::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: ${({ theme }) => theme.primaryText};
      cursor: pointer;
    }
    &:disabled {
      cursor: not-allowed;
      ::-webkit-slider-thumb {
        cursor: not-allowed;
        background: ${({ theme }) => theme.faintText};
      }
    }
  }
  input[type="text"],
  input[type="number"] {
    padding-left: 5px;
    color: ${({ theme }) => theme.faintText};
    font-weight: 600;
    padding-bottom: 5px;
    ::placeholder {
      color: ${({ theme }) => theme.faintText};
    }
  }
`

export interface DevToolSettings {
  position: string
  transparency: number
  theme: string
  width: number
  height: number
  vibrancy: number
  fonts: string
  fontSize: number
  itemSpacing: number
}

export const recoilDevToolSettingsOpenState = atom({
  key: `devToolSettingsOpen`,
  default: false,
})

const SettingsPage: FC = () => {
  const [
    {
      position,
      theme,
      transparency,
      vibrancy,
      fonts,
      fontSize,
      itemSpacing,
      height,
    },
    setSettings,
  ] = useRecoilState(recoilDevToolsSettingsState)

  const setOpen = useSetRecoilState(recoilDevToolSettingsOpenState)
  return (
    <Container height={height} position={position}>
      <div className="devSettingsTop">
        <div onClick={() => setOpen(false)}>
          {`<`} <p>Back</p>
        </div>
      </div>
      <Option>
        <label>Position</label>
        <select
          value={position}
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              position: e.target.value,
            }))
          }
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="bottom">Bottom</option>
        </select>
      </Option>
      <Option>
        <label>Theme</label>
        <select
          value={theme}
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              theme: e.target.value,
            }))
          }
        >
          {Object.keys(devThemes).map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </Option>
      <Option>
        <label>Fonts</label>
        <input
          value={fonts}
          placeholder="Monospace"
          type="text"
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              fonts: e.target.value,
            }))
          }
        />
      </Option>
      <Option>
        <label>Font Size</label>
        <input
          value={fontSize}
          type="number"
          min={7}
          max={24}
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              fontSize: Number(e.target.value),
            }))
          }
        />
      </Option>
      <Option>
        <label>Item Spacing</label>
        <input
          value={itemSpacing}
          type="range"
          min={0}
          max={10}
          step={1}
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              itemSpacing: Number(e.target.value),
            }))
          }
        />
      </Option>
      <Option>
        <label>Transparency</label>
        <input
          type="range"
          min="0"
          step="0.01"
          max=".5"
          value={transparency}
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              transparency: Number(e.target.value),
            }))
          }
        />
      </Option>
      <Option>
        <label>Vibrancy</label>
        <input
          type="range"
          min="0"
          step="1"
          max="50"
          value={vibrancy}
          disabled={transparency === 0}
          onChange={(e) =>
            setSettings((prev: DevToolSettings) => ({
              ...prev,
              vibrancy: Number(e.target.value),
            }))
          }
        />
      </Option>
    </Container>
  )
}

export default SettingsPage
