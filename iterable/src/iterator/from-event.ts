import {BufferStrategy, PushableIterator} from './pushable-iterator'

export function fromEvent<TEvent, TEventEmitter, TOut>(
  eventEmitter: TEventEmitter,
  addEventListener: (
    eventEmitter: TEventEmitter,
    listener: (event: TEvent) => void,
  ) => void,
  removeEventListener: (
    eventEmitter: TEventEmitter,
    listener: (event: TEvent) => void,
  ) => void,
  bufferStrategy: BufferStrategy<TEvent, TOut, any>,
): AsyncIterator<TOut> & Readonly<{close: () => void}> {
  let listener: ((event: TEvent) => void) | undefined
  const iterator = new PushableIterator({
    ...bufferStrategy,
    close() {
      if (listener) {
        removeEventListener(eventEmitter, listener)
      }

      if (bufferStrategy.close) {
        bufferStrategy.close()
      }
    },
  })
  listener = (event) => iterator.push(event)
  addEventListener(eventEmitter, listener)

  return {
    next: iterator.next,
    close: iterator.close,
  }
}
