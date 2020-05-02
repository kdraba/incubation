export type Value = string | number | null

export enum Type {
  OBJECT_START,
  OBJECT_END,
  ARRAY_START,
  ARRAY_END,
  ATTRIBUTE_NAME_START,
  ATTRIBUTE_NAME_END,
  ATTRIBUTE_NAME,
  ATTRIBUTE_VALUE_SEPERATOR,
  STRING_VALUE_START,
  STRING_VALUE_END,
  VALUE_SEPERATOR,
  VALUE,
}

export type Event =
  | {text: '{'; level: number; type: Type.OBJECT_START}
  | {text: '}'; level: number; type: Type.OBJECT_END}
  | {text: '['; level: number; type: Type.ARRAY_START}
  | {text: ']'; level: number; type: Type.ARRAY_END}
  | {
      text: ':'
      level: number
      type: Type.ATTRIBUTE_VALUE_SEPERATOR
    }
  | {
      text: '"'
      level: number
      type:
        | Type.STRING_VALUE_START
        | Type.STRING_VALUE_END
        | Type.ATTRIBUTE_NAME_START
        | Type.ATTRIBUTE_NAME_END
    }
  | {text: ','; level: number; type: Type.VALUE_SEPERATOR}
  | {
      text: string
      level: number
      type: Type.VALUE | Type.ATTRIBUTE_NAME
    }

export class InitialWriter {
  constructor(
    private readonly encoder: (s: string) => string = (s) =>
      s.replace(/\\/g, '\\\\').replace(/"/g, '"'),
  ) {}

  async *createObject(fn?: (writer: ObjectWriter) => AsyncIterable<Event>) {
    const writer = new ObjectWriter(0, this.encoder)

    yield* writer.startObject()
    if (fn) {
      yield* fn(writer)
    }
    yield* writer.endObject()
  }

  async *createArray(fn?: (writer: ArrayWriter) => AsyncIterable<Event>) {
    const writer = new ArrayWriter(0, this.encoder)

    yield* writer.startArray()
    if (fn) {
      yield* fn(writer)
    }
    yield* writer.endArray()
  }
}

export class ObjectWriter {
  private isFirst = true

  constructor(
    private readonly level: number,
    private readonly encoder: (s: string) => string,
  ) {}

  async *startObject(): AsyncIterable<Event> {
    yield {text: '{', level: this.level, type: Type.OBJECT_START}
  }

  async *endObject(): AsyncIterable<Event> {
    yield {text: '}', level: this.level, type: Type.OBJECT_END}
  }

  async *addObjectAttribute(
    name: string,
    fn?: (writer: ObjectWriter) => AsyncIterable<Event>,
  ): AsyncIterable<Event> {
    if (!this.isFirst) {
      yield {
        text: ',',
        level: this.level,
        type: Type.VALUE_SEPERATOR,
      }
    }

    yield* writeAttributeKey(name, this.level, this.encoder)

    this.isFirst = false
    const writer = new ObjectWriter(this.level + 1, this.encoder)
    yield* writer.startObject()
    if (fn) {
      yield* fn(writer)
    }
    yield* writer.endObject()
  }

  async *addArrayAttribute(
    name: string,
    fn?: (writer: ArrayWriter) => AsyncIterable<Event>,
  ): AsyncIterable<Event> {
    if (!this.isFirst) {
      yield {
        text: ',',
        level: this.level,
        type: Type.VALUE_SEPERATOR,
      }
    }

    yield* writeAttributeKey(name, this.level, this.encoder)

    this.isFirst = false
    const writer = new ArrayWriter(this.level + 1, this.encoder)

    yield* writer.startArray()
    if (fn) {
      yield* fn(writer)
    }
    yield* writer.endArray()
  }

  async *addValueAttribute(name: string, value: Value): AsyncIterable<Event> {
    if (!this.isFirst) {
      yield {
        text: ',',
        level: this.level,
        type: Type.VALUE_SEPERATOR,
      }
    }

    yield* writeAttributeKey(name, this.level, this.encoder)
    yield* writeValue(value, this.level, this.encoder)

    this.isFirst = false
  }
}

export class ArrayWriter {
  private isFirst = true

  constructor(
    private readonly level: number,
    private readonly encoder: (s: string) => string,
  ) {}

  async *startArray(): AsyncIterable<Event> {
    yield {text: '[', level: this.level, type: Type.ARRAY_START}
  }

  async *endArray(): AsyncIterable<Event> {
    yield {text: ']', level: this.level, type: Type.ARRAY_END}
  }

  async *createObject(
    fn?: (writer: ObjectWriter) => AsyncIterable<Event>,
  ): AsyncIterable<Event> {
    if (!this.isFirst) {
      yield {
        text: ',',
        level: this.level,
        type: Type.VALUE_SEPERATOR,
      }
    }

    this.isFirst = false
    const writer = new ObjectWriter(this.level + 1, this.encoder)

    yield* writer.startObject()
    if (fn) {
      yield* fn(writer)
    }
    yield* writer.endObject()
  }

  async *createArray(
    fn?: (writer: ArrayWriter) => AsyncIterable<Event>,
  ): AsyncIterable<Event> {
    if (!this.isFirst) {
      yield {
        text: ',',
        level: this.level,
        type: Type.VALUE_SEPERATOR,
      }
    }

    this.isFirst = false
    const writer = new ArrayWriter(this.level + 1, this.encoder)

    yield* writer.startArray()
    if (fn) {
      yield* fn(writer)
    }
    yield* writer.endArray()
  }

  async *addValue(value: Value): AsyncIterable<Event> {
    if (!this.isFirst) {
      yield {
        text: ',',
        level: this.level,
        type: Type.VALUE_SEPERATOR,
      }
    }

    yield* writeValue(value, this.level, this.encoder)

    this.isFirst = false
  }
}

async function* writeValue(
  value: Value,
  level: number,
  encoder: (s: string) => string,
): AsyncIterable<Event> {
  if (typeof value === 'number') {
    yield {text: `${value}`, level, type: Type.VALUE}
  } else if (value === null) {
    yield {text: 'null', level, type: Type.VALUE}
  } else {
    yield {text: '"', level, type: Type.STRING_VALUE_START}
    yield {text: encoder(value), level, type: Type.VALUE}
    yield {text: '"', level, type: Type.STRING_VALUE_END}
  }
}

async function* writeAttributeKey(
  name: string,
  level: number,
  encoder: (s: string) => string,
): AsyncIterable<Event> {
  yield {text: '"', level, type: Type.ATTRIBUTE_NAME_START}
  yield {text: encoder(name), level, type: Type.ATTRIBUTE_NAME}
  yield {text: '"', level, type: Type.ATTRIBUTE_NAME_END}
  yield {text: ':', level, type: Type.ATTRIBUTE_VALUE_SEPERATOR}
}

export async function* addAttributes(
  writer: ObjectWriter,
  object: {},
): AsyncIterable<Event> {
  for (const [attributeName, attributeValue] of Object.entries(object)) {
    if (
      attributeValue === null ||
      typeof attributeValue === 'string' ||
      typeof attributeValue === 'number'
    ) {
      yield* writer.addValueAttribute(attributeName, attributeValue)
    } else if (Array.isArray(attributeValue)) {
      yield* writer.addArrayAttribute(attributeName, (w) =>
        addValues(w, attributeValue),
      )
    } else if (typeof attributeValue === 'object') {
      yield* writer.addObjectAttribute(attributeName, (w) =>
        addAttributes(w, attributeValue as object),
      )
    }
  }
}

export async function* addValues(
  writer: ArrayWriter,
  values: unknown[],
): AsyncIterable<Event> {
  for (const value of values) {
    if (value === null || typeof value === 'string' || value === 'number') {
      yield* writer.addValue(value)
    } else if (Array.isArray(value)) {
      yield* writer.createArray((w) => addValues(w, value))
    } else if (typeof value === 'object') {
      yield* writer.createObject((w) => addAttributes(w, value as object))
    }
  }
}
