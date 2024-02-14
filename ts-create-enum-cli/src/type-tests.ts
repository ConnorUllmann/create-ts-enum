/**
 * @description Pretends to be an "it" test (even resulting in a successful test) but really serves as a way to define
 * unused code that can check for type errors using @ts-expect-error comments.
 * @param _message Name of the test
 * @param _fn Function containing the unused code with type checks.
 */
export function itTypes(_message: string, _fn: () => void) {
  _message = typeof _message === 'string' ? _message : 'Type tests';
  it(_message, () => {
    expect('types').toBe('types')
  })
}