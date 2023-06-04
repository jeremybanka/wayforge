import * as AtomIO from "atom.io";

export const secretState = AtomIO.atom<string>({
  key: `secret`,
  default: ``,
  effects: 
});