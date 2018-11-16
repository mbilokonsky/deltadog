subject = require('../../../src/universe/indexing_rules/deltas_by_id')
describe('universe secondary index by id', () => {
  it ('is a function', () => {
    expect(typeof subject).toBe('function');
  })

  it('takes an array of objects with an id property and returns a hash of id:object', () => {
    const input = [
      {id: 'abc', foo: 'bar'},
      {id: 'def', foo: 'baz'},
      {id: 'ghi', foo: 'bang'}
    ]

    const index = subject(input);

    expect(index.abc).toBe(input[0])
    expect(index.def).toBe(input[1])
    expect(index.ghi).toBe(input[2])
  })
})