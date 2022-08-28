import type { FC } from "react"
import React, { useCallback, useEffect } from "react"

import type { PanInfo } from "framer-motion"
import { motion, useMotionValue } from "framer-motion"
import { useRecoilState } from "recoil"
import styled, { css } from "styled-components"

import { recoilDevToolsSettingsState } from "."

export const HANDLE_SIZE = 10

const ResizeHandle = styled(motion.div)<{ layerPosition: string }>`
  position: absolute;
  ${({ layerPosition }) => {
    if (layerPosition === `right`) return `left: -10px;`
    if (layerPosition === `left`) return `right: -10px;`
    if (layerPosition === `bottom`) return `left: 0;`
  }};
  background-color: ${({ theme }) => theme.background}bf;
  ${({ layerPosition }) => {
    if (layerPosition === `right`) return `border-left: 1px solid #00000030;`
    if (layerPosition === `left`) return `border-right: 1px solid #00000030;`
    if (layerPosition === `bottom`) return `border-top: 1px solid #00000030;`
  }}
  backdrop-filter: blur(5px);
  z-index: 20002;
  ${({ layerPosition }) => {
    if (layerPosition === `bottom`) {
      return css`
        cursor: row-resize;
        height: ${HANDLE_SIZE}px;
        width: 100%;
        top: -${HANDLE_SIZE}px;
      `
    }
    return css`
      cursor: col-resize;
      height: 100%;
      width: ${HANDLE_SIZE}px;
      top: 0;
    `
  }};
`
const LayerContainer = styled(motion.div)<{
  layerPosition: string
  layerWidth: number
  layerHeight: number
}>`
  position: fixed;
  display: flex;
  left: ${({ layerPosition }) => (layerPosition === `left` ? `0` : `initial`)};
  right: ${({ layerPosition }) => (layerPosition === `right` ? `0` : `initial`)};
  ${({ layerPosition, layerWidth, layerHeight }) => {
    if (layerPosition === `bottom`) {
      return css`
        height: ${layerHeight}px;
        width: 100vw;
        left: 0;
        right: 0;
        top: initial;
        bottom: 0;
        max-height: calc(100vh - ${HANDLE_SIZE}px);
      `
    }
    return css`
      height: 100vh;
      width: ${layerWidth}px;
      top: 0;
      bottom: initial;
      max-width: calc(100vw - ${HANDLE_SIZE}px);
    `
  }}
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 20000;
`

const ResizableContainer: FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [{ position, width, height }, setSettings] = useRecoilState(
    recoilDevToolsSettingsState
  )

  const mWidth = useMotionValue(width)
  const mHeight = useMotionValue(height)

  useEffect(() => {
    mWidth.onChange((v) => {
      setSettings((s) => ({ ...s, width: v }))
    })
    mHeight.onChange((v) => {
      setSettings((s) => ({ ...s, height: v }))
    })
  }, [mWidth, setSettings, mHeight])

  const handleDrag = useCallback(
    (event: MouseEvent, info: PanInfo) => {
      let newValue = 0

      if (position !== `bottom`) {
        if (position === `left`) newValue = mWidth.get() + info.delta.x
        if (position === `right`) newValue = mWidth.get() - info.delta.x

        if (newValue > 200 && newValue < 1200) {
          mWidth.set(newValue)
        }
      }

      if (position === `bottom`) {
        newValue = mHeight.get() - info.delta.y

        if (newValue > 200 && newValue < 750) {
          mHeight.set(newValue)
        }
      }
    },
    [mWidth, position, mHeight]
  )
  return (
    <LayerContainer
      layerWidth={width}
      layerHeight={height}
      layerPosition={position}
    >
      <ResizeHandle
        drag={position !== `bottom` ? `x` : `y`}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        onDrag={handleDrag}
        dragElastic={0}
        dragMomentum={false}
        layerPosition={position}
      />
      {children}
    </LayerContainer>
  )
}

export default ResizableContainer
