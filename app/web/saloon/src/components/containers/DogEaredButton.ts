import styled from "@emotion/styled"
import { motion } from "framer-motion"

import { DogEared } from "./corners"

export const DogEaredButton = styled(
  DogEared(motion.button, {
    noClipping: true,
    below: [
      {
        color: `white`,
        stroke: { width: 2, color: `var(--fg-color)` },
      },
    ],
  })
)`
  font-family: Uruz;
  font-size: 18px;
  font-weight: 500;
  border: none;
  padding: 3px 13px 5px;
  cursor: pointer;
  position: relative;
  &:hover {
    transform: scale(1.1);
    z-index: 10000 !important;
    > svg > path {
      fill: yellow;
    }
  }
  &:active {
    transform: scale(0.95);
    > svg > path {
      fill: orange;
    }
  }
`
