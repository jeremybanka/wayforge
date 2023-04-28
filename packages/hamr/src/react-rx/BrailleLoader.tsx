import type { FC } from "react"
import { useEffect, useState } from "react"

export const BRAILLE_ALPHABET = `⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿`

export const BrailleLoader: FC = () => {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((index) => (index + 1) % BRAILLE_ALPHABET.length)
    }, 100)
    return () => clearInterval(interval)
  }, [])
  return <div className="braille-loader">{BRAILLE_ALPHABET[index]}</div>
}
