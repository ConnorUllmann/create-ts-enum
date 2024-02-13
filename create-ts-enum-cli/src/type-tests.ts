function itTypes(_message: string, _fn: () => void) {
  _message = typeof _message === 'string' ? _message : 'Type tests';
  it(_message, () => {
    expect('types').toBe('types')
  })
}

export { itTypes}