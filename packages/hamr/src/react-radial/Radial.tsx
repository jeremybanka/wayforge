import * as React from "react"

import { css } from "@emotion/react"
import { AnimatePresence } from "framer-motion"
import { makeMouseHandlers } from "hamr/react-click-handlers"
import { setCssVars } from "hamr/react-css-vars"

import type { RadialAction, RadialMode } from "."
import { header } from "./<header>"

export type RadialProps = {
  mouseActivationMethod?: string
  useActions: () => RadialAction[]
  useMousePosition: () => {
    x: number
    y: number
  }
  useMode: () => [RadialMode, (newMode: RadialMode) => void]
  size?: number
}

export const Radial: React.FC<RadialProps> = ({
  useActions,
  useMousePosition,
  useMode,
  size = 60,
}) => {
  const actions = useActions()
  const position = useMousePosition()
  const [mode, setMode] = useMode()

  const isActive = mode !== `idle`

  const activePosition = React.useRef<{
    x: number
    y: number
  } | null>(null)

  const hasPressed = React.useRef<number | null>(null)
  const label = React.useRef<string | null>(null)

  if (isActive && activePosition.current === null) {
    activePosition.current = position
  } else if (!isActive) {
    activePosition.current = null
  }

  const currentPosition = {
    ...position,
    ...(activePosition.current ?? {}),
  }

  const ringRatio = Math.sqrt(Math.max(actions.length, 4) - 2)

  return (
    <>
      <div
        style={setCssVars({
          [`--action-count`]: `${actions.length}`,
          [`--x`]: currentPosition.x + `px`,
          [`--y`]: currentPosition.y + `px`,
          [`--ring-size`]: ringRatio * size + `px`,
          [`--option-size`]: (isActive ? size : 20) + `px`,
          [`--is-active-pointer-events`]: isActive ? `all` : `none`,
          [`--is-active-opacity`]: isActive ? 1 : 0.1,
          [`--is-active-background`]: isActive ? `#3337` : `#fff`,
          [`--is-active-border`]: isActive
            ? `1px solid #fff`
            : `10px solid #000`,
        })}
        css={css`
          pointer-events: none;
          top: calc((var(--y)) - var(--ring-size) / 2);
          left: calc((var(--x)) - var(--ring-size) / 2);
          height: var(--ring-size);
          width: var(--ring-size);
          position: fixed;
          border-radius: 50%;
          z-index: 20;
          transition: all 100ms ease-in;
          opacity: var(--is-active-opacity);
          .radial-option {
            color: #fff;
            transition: all 100ms ease-in;
            pointer-events: var(--is-active-pointer-events);
            user-select: none;
            position: absolute;
            border: var(--is-active-border);
            background: var(--is-active-background);
            border-radius: 50%;
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 300;
            font-size: 0.8em;
            &:hover {
              background: #fff;
              color: #000;
            }
            &:active,
            &:hover.pressed {
              background: #000;
              color: #fff;
            }
            &.back {
              position: fixed;
              top: calc(var(--y) - var(--option-size) / 4);
              left: calc(var(--x) - var(--option-size) / 4);
              height: calc(var(--option-size) * 0.5);
              width: calc(var(--option-size) * 0.5);
              background: #000;
              color: #fff;
              &:hover {
                background: #fff;
                color: #000;
              }
            }
          }
        `}
      >
        {mode === `open` ? (
          <div
            className={`radial-option back`}
            onMouseUp={() => setMode(`idle`)}
            onContextMenu={(e) => e.preventDefault()}
          >
            x
          </div>
        ) : null}
        {actions.map((opt, idx): React.ReactElement => {
          return (
            <div
              key={idx}
              className={
                `radial-option` + (hasPressed.current === idx ? ` pressed` : ``)
              }
              {...makeMouseHandlers({
                onMouseUpR: () => (
                  opt.do(),
                  (hasPressed.current = idx),
                  setTimeout(
                    () => (setMode(`idle`), (hasPressed.current = null)),
                    250
                  )
                ),
                onMouseUpL: opt.do,
              })}
              onMouseEnter={() => (label.current = opt.label)}
              onMouseLeave={() => (label.current = null)}
              style={setCssVars({
                [`--idx`]: `${idx}`,
              })}
              css={css`
                --opt-ratio: calc(var(--idx) / var(--action-count));
                --opt-angle: calc(90deg + (-360deg * var(--opt-ratio)));
                --yy: sin(var(--opt-angle));
                --xx: cos(var(--opt-angle));
                height: var(--option-size);
                width: var(--option-size);
                bottom: calc(
                  ((var(--ring-size) / 2) - var(--option-size) / 2) +
                    (var(--yy) * var(--ring-size) / 2)
                );
                left: calc(
                  ((var(--ring-size) / 2) - var(--option-size) / 2) +
                    (var(--xx) * var(--ring-size) / 2)
                );
              `}
            >
              {idx + 1}
            </div>
          )
        })}
      </div>
      <footer
        style={setCssVars({
          [`--x`]: currentPosition.x + `px`,
          [`--y`]: currentPosition.y + `px`,
          [`--size`]: ringRatio * size + `px`,
        })}
        css={css`
          pointer-events: none;
          position: fixed;
          top: calc(var(--y) - (100px + (var(--size) / 2)));
          left: calc(var(--x) - 250px);
          width: 500px;
          height: var(--size);
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          color: var(--bg-color);
          header {
            padding: 10px 20px;
          }
        `}
      >
        <AnimatePresence>
          {label.current === null ? null : (
            <header.roundedInverse
              initial={{ opacity: 0, transform: `scale(0.95)` }}
              animate={{ opacity: 1, transform: `scale(1)` }}
              exit={{ opacity: 0, transform: `scale(0.95)` }}
              transition={{ duration: 0.1 }}
            >
              {label.current}
            </header.roundedInverse>
          )}
        </AnimatePresence>
      </footer>
    </>
  )
}
