import type { FC } from "react"

import { useRecoilState } from "recoil"
import styled from "styled-components"

import { devToolsOpenState } from "."
import { ReactComponent as Logo } from "./recoil.svg"

const RecoilIcon = styled.button<{
  toolsAreOpen: boolean
}>`
  border: none;
  height: 40px;
  width: 40px;
  position: fixed;
  left: 8px;
  bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 20000;
  pointer-events: all;
  border-radius: 50%;
  background: #ffffff78;
  backdrop-filter: blur(30px);
  box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.15);
  opacity: ${({ toolsAreOpen }) => (toolsAreOpen ? 1 : 0.75)};
  transition: opacity 0.2s, transform 0.2s;
  border-top: 1px solid #0000001a;
  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
  svg {
    width: 30px;
    height: 30px;
    path {
      fill: #424242;
    }
  }
`

const DevToolsIcon: FC = () => {
  const [isOpen, setIsOpen] = useRecoilState(devToolsOpenState)
  return (
    <RecoilIcon
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      toolsAreOpen={isOpen}
    >
      <Logo />
    </RecoilIcon>
  )
}

export default DevToolsIcon
