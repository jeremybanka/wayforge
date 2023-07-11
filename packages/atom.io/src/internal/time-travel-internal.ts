import type { Store } from "."
import { IMPLICIT } from "."
import type { TimelineToken } from ".."
import { setState } from ".."

export const redo__INTERNAL = (
  token: TimelineToken,
  store: Store = IMPLICIT.STORE
): void => {
  store.config.logger?.info(`⏩ redo "${token.key}"`)
  const timelineData = store.timelineStore.get(token.key)
  if (!timelineData) {
    store.config.logger?.error(
      `Failed to redo on timeline "${token.key}". This timeline has not been initialized.`
    )
    return
  }
  if (timelineData.at === timelineData.history.length) {
    store.config.logger?.warn(
      `Failed to redo at the end of timeline "${token.key}". There is nothing to redo.`
    )
    return
  }
  timelineData.timeTraveling = true
  const update = timelineData.history[timelineData.at]
  switch (update.type) {
    case `atom_update`: {
      const { key, newValue } = update
      setState({ key, type: `atom` }, newValue)
      break
    }
    case `selector_update`:
    case `transaction_update`: {
      for (const atomUpdate of update.atomUpdates) {
        const { key, newValue } = atomUpdate
        setState({ key, type: `atom` }, newValue)
      }
      break
    }
  }
  ++timelineData.at
  timelineData.timeTraveling = false
  store.config.logger?.info(
    `⏹️ "${token.key}" is now at ${timelineData.at} / ${timelineData.history.length}`
  )
}

export const undo__INTERNAL = (
  token: TimelineToken,
  store: Store = IMPLICIT.STORE
): void => {
  store.config.logger?.info(`⏪ undo "${token.key}"`)
  const timelineData = store.timelineStore.get(token.key)
  if (!timelineData) {
    store.config.logger?.error(
      `Failed to undo on timeline "${token.key}". This timeline has not been initialized.`
    )
    return
  }
  if (timelineData.at === 0) {
    store.config.logger?.warn(
      `Failed to undo at the beginning of timeline "${token.key}". There is nothing to undo.`
    )
    return
  }
  timelineData.timeTraveling = true

  --timelineData.at
  const update = timelineData.history[timelineData.at]
  switch (update.type) {
    case `atom_update`: {
      const { key, oldValue } = update
      setState({ key, type: `atom` }, oldValue)
      break
    }
    case `selector_update`:
    case `transaction_update`: {
      for (const atomUpdate of update.atomUpdates) {
        const { key, oldValue } = atomUpdate
        setState({ key, type: `atom` }, oldValue)
      }
      break
    }
  }
  timelineData.timeTraveling = false
  store.config.logger?.info(
    `⏹️ "${token.key}" is now at ${timelineData.at} / ${timelineData.history.length}`
  )
}
