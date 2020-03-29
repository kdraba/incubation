import {EventTarget, NeverEventNames} from './event-target.type'

export class EventTargetSupport<TEventMap extends {}>
  implements EventTarget<TEventMap> {
  private readonly listeners = new Map<
    keyof TEventMap,
    Set<(event: any) => void>
  >()

  addEventListener<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: (event: TEventMap[TEventName]) => void,
  ): void {
    let listeners = this.listeners.get(eventName)
    if (!listeners) {
      listeners = new Set()
      this.listeners.set(eventName, listeners)
    }

    listeners.add(listener)
  }

  removeEventListener<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: (event: TEventMap[TEventName]) => void,
  ): void {
    const listeners = this.listeners.get(eventName)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  dispatchEvent<TEventName extends NeverEventNames<TEventMap>>(
    eventName: TEventName,
  ): void
  dispatchEvent<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    event: TEventMap[TEventName],
  ): void
  dispatchEvent<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    event?: TEventMap[TEventName],
  ) {
    const listeners = this.listeners.get(eventName)
    if (listeners) {
      for (const listener of listeners.values()) {
        listener(event)
      }
    }
  }

  clear() {
    this.listeners.clear()
  }
}
