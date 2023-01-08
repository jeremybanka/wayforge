import type { StatusResult } from "simple-git"

export const DEFAULT_STATUS_RESULT: StatusResult = {
  ahead: 0,
  behind: 0,
  current: ``,
  modified: [],
  not_added: [],
  conflicted: [],
  deleted: [],
  created: [],
  renamed: [],
  files: [],
  staged: [],
  tracking: ``,
  detached: false,
  isClean: () => true,
}
