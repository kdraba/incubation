export function formatTime(v: number) {
  let s = Math.floor(v / 1000)
  let m = Math.floor(s / 60)
  s = s % 60
  const h = Math.floor(m / 60)
  m = m % 60
  return [h ? `${h}h` : false, m ? `${m}m` : false, s ? `${s}s` : false]
    .filter((v) => v)
    .join('')
}
