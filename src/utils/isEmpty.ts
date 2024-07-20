// @ ts-ignore
const isEmpty = (value: any | any[]): boolean => {
  if (value === null) return true
  if (typeof value === 'undefined') return true
  if (typeof value === 'string' && value === '') return true
  if (Array.isArray(value) && value.length < 1) return true
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof value === 'object' && value.constructor.name === 'Object' && Object.keys(value).length < 1 && Object.getOwnPropertyNames(value) < 1) return true
  if (typeof value === 'object' && value.constructor.name === 'String' && Object.keys(value).length < 1) return true
  else return false
}

export default isEmpty