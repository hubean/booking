export function success<T>(data: T, msg = 'success') {
  return { code: 200, msg, data }
}

export function fail(code: number, msg: string) {
  return { code, msg, data: null }
}
