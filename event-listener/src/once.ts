export function once<TEvent extends string>(
  target: {
    addEventListener(eventName: TEvent, listener: (event: TEvent) => void): void
    removeEventListener(
      eventName: TEvent,
      listener: (event: TEvent) => void,
    ): void
  },
  eventName: TEvent,
  listener: (event: TEvent) => void,
) {
  const l = (event: TEvent) => {
    try {
      listener(event)
    } finally {
      target.removeEventListener(eventName, l)
    }
  }
  target.addEventListener(eventName, l)

  return () => target.removeEventListener(eventName, l)
}
