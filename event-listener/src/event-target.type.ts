export interface EventTarget<TEventMap extends {}> {
  addEventListener<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: (event: TEventMap[TEventName]) => void,
  ): void
  removeEventListener<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: (event: TEventMap[TEventName]) => void,
  ): void
}

export type NeverEventNames<TEventMap extends {}> = {
  [key in keyof TEventMap]: TEventMap[key] extends never ? key : never
}[keyof TEventMap]
