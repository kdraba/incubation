export interface Stats {
  progress: number
  estimate: number
  duration: number
  eta: number
  byteCount: number
  size: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
}

export interface Release {
  id: string
  barcodes: ReadonlyArray<string>
  title?: string
  artists: ReadonlyArray<Readonly<Artist>>
  released?: string

  startPos: number
  endPos: number

  count: number
  eventCount: number
}

export interface Artist {
  id: string
  name: string
}
