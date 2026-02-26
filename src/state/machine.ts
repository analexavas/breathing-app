import type { StretchSet } from '../types'

// ── State ─────────────────────────────────────────────────────────────────────

export type AppScreen =
  | 'IDLE'
  | 'PAUSE'
  | 'CHOOSE'
  | 'STRETCH'
  | 'WALK'
  | 'TOUCH'
  | 'SETTINGS'
  | 'ANALYTICS'

export interface AppState {
  screen: AppScreen
  returnScreen: AppScreen      // where to return after SETTINGS / ANALYTICS
  sessionId: string | null
  stretchSet: StretchSet | null
  touchVariant: string | null
  offerTouch: boolean          // show "Touch task?" after STRETCH or WALK
}

// ── Actions ───────────────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'HOTKEY_PRESSED' }
  | { type: 'SESSION_STARTED'; sessionId: string }
  | { type: 'PAUSE_DONE'; completed: boolean }
  | { type: 'CHOOSE_STRETCH'; set: StretchSet }
  | { type: 'CHOOSE_WALK' }
  | { type: 'CHOOSE_TOUCH'; variant: string }
  | { type: 'STRETCH_DONE'; completed: boolean }
  | { type: 'WALK_DONE'; completed: boolean }
  | { type: 'TOUCH_DONE' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'OPEN_ANALYTICS' }
  | { type: 'CLOSE_ANALYTICS' }
  | { type: 'EXIT' }

// ── Initial state ─────────────────────────────────────────────────────────────

export const initialState: AppState = {
  screen: 'IDLE',
  returnScreen: 'IDLE',
  sessionId: null,
  stretchSet: null,
  touchVariant: null,
  offerTouch: false
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function machineReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HOTKEY_PRESSED':
      if (state.screen !== 'IDLE') return state   // already active
      return { ...state, screen: 'PAUSE', sessionId: null, offerTouch: false }

    case 'SESSION_STARTED':
      return { ...state, sessionId: action.sessionId }

    case 'PAUSE_DONE':
      return { ...state, screen: 'CHOOSE' }

    case 'CHOOSE_STRETCH':
      return { ...state, screen: 'STRETCH', stretchSet: action.set }

    case 'CHOOSE_WALK':
      return { ...state, screen: 'WALK' }

    case 'CHOOSE_TOUCH':
      return { ...state, screen: 'TOUCH', touchVariant: action.variant }

    case 'STRETCH_DONE':
      return {
        ...state,
        screen: 'CHOOSE',
        stretchSet: null,
        offerTouch: action.completed
      }

    case 'WALK_DONE':
      return { ...state, screen: 'CHOOSE', offerTouch: action.completed }

    case 'TOUCH_DONE':
      return { ...initialState }   // back to IDLE, clear everything

    case 'OPEN_SETTINGS':
      return { ...state, returnScreen: state.screen, screen: 'SETTINGS' }

    case 'CLOSE_SETTINGS':
      return { ...state, screen: state.returnScreen }

    case 'OPEN_ANALYTICS':
      return { ...state, returnScreen: state.screen, screen: 'ANALYTICS' }

    case 'CLOSE_ANALYTICS':
      return { ...state, screen: state.returnScreen }

    case 'EXIT':
      return { ...initialState }

    default:
      return state
  }
}
