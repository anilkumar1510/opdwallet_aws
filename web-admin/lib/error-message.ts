// The API's exception filter puts the whole HttpException response into
// `message`, so the real text arrives nested as message.message — and for
// validation failures that inner value is an array. Passing the raw `message`
// to React crashed the page with "Objects are not valid as a React child".
export function getErrorMessage(errorData: any): string {
  const detail = typeof errorData?.message === 'object' && errorData.message !== null
    ? errorData.message.message
    : errorData?.message

  if (Array.isArray(detail)) return detail.join(', ')
  return typeof detail === 'string' ? detail : ''
}
