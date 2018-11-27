const guids = require('../../../src/guids')
const subject = require('../../../src/universe/indexing_rules/names_by_id')
describe('universe secondary index ids by name', () => {
  let canon, index;
  beforeEach(() => {
    canon = [
      { id: 'a', pointers: {}}, // will have one name
      { id: 'b', pointers: {}}, // will have two names
      { id: 'c', pointers: {}}, // will have no names
      { id: 'x', pointers: {      // this assigns the name 'foo' to the entity with the id 'a'
        [guids.pointers.name]:  { target: 'foo', property: guids.properties.things_with_this_name },
        [guids.pointers.named]:  { target: 'a', property: guids.properties.names }
      }},
      { id: 'y', pointers: {      // this assigns the name 'foo' to the entity with the id 'b'
        [guids.pointers.name]: { target: 'foo', property: guids.properties.things_with_this_name },
        [guids.pointers.named]: { target: 'b', property: guids.properties.names }
      }},
      { id: 'z', pointers: {      // this assigns the name 'bar' to the entity with the id 'b'
        [guids.pointers.name]: { target: 'bar', property: guids.properties.things_with_this_name },
        [guids.pointers.named]: { target: 'b', property: guids.properties.names }
      }}
    ];
    index = subject(canon)
  })
  
  it('is a function', () => {
    expect(typeof subject).toBe('function');
  })

  it('returns all names of assigned to a node with the given id', () => {
    expect(Array.isArray(index.foo)).toBeTruthy
    expect(index.a).toEqual(['foo'])
    expect(index.b).toEqual(['foo', 'bar'])
  })
})