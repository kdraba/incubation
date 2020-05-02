/*export function binarySearch(
  value: string,
  {start, length, generateKey}: {
    start: number
    length: number,
    generateKey: (index: number) => string,
  }
): number {
  const halfLength = Math.floor(length / 2)
  const index = start + halfLength
  const indexValue = generateKey(index)
  const r = value.localeCompare(indexValue)

  if (halfLength <= 0) {
    return r < 0 ? index : index + 1
  } else {
    return binarySearch(value, {
      start: r < 0 ? start : index, 
      length: halfLength,
      generateKey,
    }) 
  }
}
*/
// 1,2,3,4
// 1,2,3

export function binarySearch(
  value: string,
  {
    start,
    length,
    generateKey,
  }: {
    start: number
    length: number
    generateKey: (index: number) => string
  },
): number {
  let left = start
  let right = start + length

  while (left < right) {
    const middle = Math.floor((left + right) / 2)
    if (value.localeCompare(generateKey(middle)) < 0) {
      right = middle
    } else {
      left = middle + 1
    }
  }
  return left - 1
}
