import {EventTargetSupport} from './event-target-support'
import {EventTarget, NeverEventNames} from './event-target.type'

type Constructor<T> = new (...args: any[]) => T

export const DISPATCH_EVENT = Symbol('dispatch-event')
export const CLEAR_EVENT_LISTENERS = Symbol('clear-event-listeners')

export interface WithEventTargetSupport<TEventMap extends {}>
  extends EventTarget<TEventMap> {
  [DISPATCH_EVENT]<TEventName extends NeverEventNames<TEventMap>>(
    eventName: TEventName,
  ): void
  [DISPATCH_EVENT]<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    event: TEventMap[TEventName],
  ): void

  [CLEAR_EVENT_LISTENERS](): void
}

export function withEventTargetSupport<
  TBase extends Constructor<any>,
  TEventMap extends {}
>(base: TBase): TBase & Constructor<WithEventTargetSupport<TEventMap>> {
  return class extends base {
    private readonly eventTargetSupport = new EventTargetSupport<TEventMap>()

    addEventListener<TEventName extends keyof TEventMap>(
      eventName: TEventName,
      listener: (event: TEventMap[TEventName]) => void,
    ): void {
      return this.eventTargetSupport.addEventListener(eventName, listener)
    }

    removeEventListener<TEventName extends keyof TEventMap>(
      eventName: TEventName,
      listener: (event: TEventMap[TEventName]) => void,
    ): void {
      return this.eventTargetSupport.removeEventListener(eventName, listener)
    }

    [DISPATCH_EVENT]<TEventName extends NeverEventNames<TEventMap>>(
      eventName: TEventName,
    ): void
    [DISPATCH_EVENT]<TEventName extends keyof TEventMap>(
      eventName: TEventName,
      event: TEventMap[TEventName],
    ): void
    [DISPATCH_EVENT]<TEventName extends keyof TEventMap>(
      eventName: TEventName,
      event?: TEventMap[TEventName],
    ) {
      return this.eventTargetSupport.dispatchEvent(eventName, event as any)
    }

    [CLEAR_EVENT_LISTENERS]() {
      return this.eventTargetSupport.clear()
    }
  }
}
