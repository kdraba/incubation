export function formatSize(v: number) {
  return `${Math.round((v / 1024 / 1024) * 100) / 100}MB`
}
