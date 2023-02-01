import type { GitInterface } from "../git-io"

export const FILLER = `—`

export type SimpleGitReturnValues = {
  [GitFunction in keyof GitInterface]: GitInterface[GitFunction] extends (
    ...args: any[]
  ) => any
    ? Awaited<ReturnType<GitInterface[GitFunction]>>
    : never
}

export const DEFAULT_SIMPLE_GIT_RETURN_VALUES: SimpleGitReturnValues = {
  add: FILLER,
  addAnnotatedTag: { name: FILLER },
  addConfig: FILLER,
  addRemote: FILLER,
  addTag: { name: FILLER },
  applyPatch: FILLER,
  binaryCatFile: FILLER,
  branch: {
    detached: false,
    current: FILLER,
    all: [FILLER],
    branches: {
      [FILLER]: {
        current: false,
        name: FILLER,
        commit: FILLER,
        label: FILLER,
        linkedWorkTree: false,
      },
    },
  },
  branchLocal: {
    detached: false,
    current: FILLER,
    all: [FILLER],
    branches: {
      [FILLER]: {
        current: false,
        name: FILLER,
        commit: FILLER,
        label: FILLER,
        linkedWorkTree: false,
      },
    },
  },
  catFile: FILLER,
  checkIgnore: [FILLER],
  checkIsRepo: false,
  checkout: FILLER,
  checkoutBranch: undefined,
  checkoutLatestTag: undefined,
  checkoutLocalBranch: undefined,
  clean: {
    dryRun: false,
    paths: [FILLER],
    files: [FILLER],
    folders: [FILLER],
  },
  clone: FILLER,
  commit: {
    author: null,
    branch: FILLER,
    commit: FILLER,
    root: false,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0,
    },
  },
  cwd: FILLER,
  deleteLocalBranch: {
    branch: FILLER,
    hash: null,
    success: false,
  },
  deleteLocalBranches: {
    all: [],
    branches: {},
    errors: [],
    success: true,
  },
  diff: FILLER,
  diffSummary: {
    changed: 0,
    files: [],
    insertions: 0,
    deletions: 0,
  },
  exec: undefined,
  fetch: {
    raw: FILLER,
    branches: [],
    tags: [],
    remote: FILLER,
    updated: [],
    deleted: [],
  },
  getConfig: {
    key: FILLER,
    value: FILLER,
    values: [],
    paths: [],
    scopes: new Map(),
  },
  getRemotes: [],
  grep: {
    paths: new Set(),
    results: {},
  },
  hashObject: FILLER,
  init: {
    bare: false,
    existing: false,
    path: FILLER,
    gitDir: FILLER,
  },
  listConfig: {
    all: {},
    files: [],
    values: {},
  },
  listRemote: FILLER,
  log: {
    all: [],
    total: 0,
    latest: null,
  },
  merge: {
    files: [],
    created: [],
    deleted: [],
    conflicts: [],
    merges: [],
    result: FILLER,
    failed: false,
    remoteMessages: {
      all: [],
    },
    insertions: {},
    deletions: {},
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0,
    },
  },
  mergeFromTo: {
    files: [],
    created: [],
    deleted: [],
    conflicts: [],
    merges: [],
    result: FILLER,
    failed: false,
    remoteMessages: {
      all: [],
    },
    insertions: {},
    deletions: {},
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0,
    },
  },
  mirror: FILLER,
  mv: { moves: [] },
  pull: {
    files: [],
    insertions: {},
    deletions: {},
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0,
    },
    created: [],
    deleted: [],
    remoteMessages: {
      all: [],
    },
  },
  push: {
    pushed: [],
    remoteMessages: {
      all: [],
    },
  },
  pushTags: {
    pushed: [],
    remoteMessages: {
      all: [],
    },
  },
  raw: FILLER,
  rebase: FILLER,
  remote: FILLER,
  removeRemote: undefined,
  reset: FILLER,
  revert: undefined,
  revparse: FILLER,
  rm: undefined,
  rmKeepLocal: undefined,
  show: FILLER,
  stash: FILLER,
  stashList: {
    all: [],
    total: 0,
    latest: null,
  },
  status: {
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
  },
  subModule: FILLER,
  submoduleAdd: FILLER,
  submoduleInit: FILLER,
  submoduleUpdate: FILLER,
  tag: FILLER,
  tags: {
    all: [],
    latest: undefined,
  },
  updateServerInfo: FILLER,
  version: {
    major: 0,
    minor: 0,
    patch: 0,
    agent: FILLER,
    installed: false,
  },
}
