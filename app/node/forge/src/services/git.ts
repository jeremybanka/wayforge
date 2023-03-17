import { simpleGit } from "simple-git"

export const Wayfarer = { git: simpleGit(`./wayfarer`) }

// export const getGitStatus = (GitClient: SimpleGit) => GitClient.status()

// export const getGitDiff = (GitClient: SimpleGit) => GitClient.diff()

// LEVELS OF APPLICATION STATE
// A. GITHUB
// // client may trigger push, pull, and rebase while status is clean
// // confirm before force push
// // client is continually fetching
// // client auto-refreshes icons as you drift out of sync with main

// B. SERVER_GIT_HISTORY
// // main branch can be read but not edited.
// // you make a branch and name it when you are making changes.
// // you can check out any branch
// // you can return to a branch and rebase it from main.
// //
// // Auto Save:
// // when you make a new branch, your first commit prompt is composed:
// //
// // 🚧 2022 Aug 1 23:20
// // you can change the prepared name at any time using a gitmoji-themed prompt
// //
// // ------------------------------------- <<
// //  ^  🚧 2022 Aug 1 23:20                |
// //     ✨ :add new feature:               |
// //     🏷️ :change types, schemata:        |
// //     💬 :change descriptions:           |
// //     📝 :change notes for developers:   |
// //     🎨 :change artwork or icons:       |
// //
// //
// // if you are dirty for more than a minute, you will be prompted to commit
// // small, gently moving notice over the commit button
// //
// // the first time you hit commit on a clean branch, several things happen
// // * the server makes your commit: msg === "🚧" ? msg +  Date.now() : msg
// // * the server pushes to your branch on github
// // * the server starts a time interval, checking if dirty and committing
// //   (the interval is set to 10 minutes but can be changed)
// // * your new commit prompt is set to 🚧

// B. SERVER_FILE_SYSTEM
// // all changes received are automatically synced to the server file system
// // loading indicator runs when a save is dispatched and while local != remote
// // files are automatically added to the commit-in-progress as you work
// // you can "reset" any files you want to remove from the commit-in-progress
// // you can add back any files you have "reset"
// // a "trash bin" of deleted files should be shown at the bottom of the
// // commit-in-progress panel

// C. SERVER_MEMORY
// // Each /wayfarer/ route corresponds to a file in the wayfarer submodule files
// // each of these pages has a LoaderFunction that corresponds to its resource
// // the /editor/ route can spawn <iframe>s that load documents from /wayfarer/
// // All resources (the file system, ) are loaded into memory at once
// // they are sent to the client via websocket
// //

// D. CLIENT_MEMORY (REMOTE & LOCAL)
// E. CLIENT_LOCAL_STORAGE (REMOTE & LOCAL)
