// Shift Concierge — Will-first onboarding engine. See docs/WILL_FIRST_UI.md.
export {
  conciergeReducer,
  initialConciergeState,
  greetingForHour,
  cleanName,
  parseMoney,
  matchOption,
  coerceFill,
  coerceFills,
  snapshotForPrompt,
  summarizeFills,
  endsWithQuestion,
  nextLineId,
  MAX_LINES,
} from "./concierge";
export type {
  Moment,
  MicChoice,
  FieldType,
  FieldOption,
  FieldSpec,
  FieldSnapshot,
  FillRequest,
  FillResult,
  Line,
  ConciergeState,
  ConciergeEvent,
} from "./concierge";

export { ConciergeFields, ConciergeField, useConciergeFields, useConciergeNav, FILL_HIGHLIGHT_MS } from "./FieldRegistry";
export type { ConciergeFieldsValue, ConciergeFieldProps, ConciergeNav } from "./FieldRegistry";

export { useAudioGate, isShiftShell } from "./useAudioGate";
export type { AudioGate } from "./useAudioGate";

export { webSpeechListener, webSpeechSupported, requestMicrophone, SILENCE_MS, WINDOW_MS } from "./listeners";
export type { Listener, ListenerHandlers } from "./listeners";

export { useConcierge } from "./useConcierge";
export type { ConciergeScript, StepContext, AskRequest, AskResult, ConciergeAdapters, UseConciergeOptions, UseConciergeReturn } from "./useConcierge";

export { ShiftConcierge } from "./ShiftConcierge";
export type { ShiftConciergeProps } from "./ShiftConcierge";
