/// <reference types="vite/client" />

import type { Settings, StretchSet, SessionStep, Analytics } from './types'

interface WindowApi {
  getSettings:       ()                                  => Promise<Settings>
  updateSettings:    (s: Partial<Settings>)              => Promise<void>
  getStretchSets:    ()                                  => Promise<StretchSet[]>
  createStretchSet:  (set: StretchSet)                   => Promise<StretchSet>
  updateStretchSet:  (set: StretchSet)                   => Promise<void>
  deleteStretchSet:  (id: string)                        => Promise<void>
  startSession:      ()                                  => Promise<string>
  logStep:           (sessionId: string, step: SessionStep) => Promise<void>
  endSession:        (sessionId: string, smoked?: boolean)  => Promise<void>
  getAnalytics:      ()                                  => Promise<Analytics>
  hideWindow:        ()                                  => Promise<void>
  updateHotkey:      (key: string)                       => Promise<void>
  onHotkeyTriggered: (cb: () => void)                    => () => void
}

declare global {
  interface Window {
    api: WindowApi
  }
}
