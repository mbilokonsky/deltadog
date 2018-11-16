const createUniverse = require('../../src/universe').createUniverse
const guids = require('../../src/guids')

describe('createUniverse', () => {
  it('is a function', () => {
    expect(typeof createUniverse).toBe('function');
  });

  describe('universe', () => {
    let universe;
    beforeEach(() => {
      universe = createUniverse();
    })

    describe('.dump', () =>{
      it('is a function', () => {expect(typeof universe.dump).toBe('function')})
      it('returns a read-only copy of the universe canon', () => {
        const dump = universe.dump()
        expect(Array.isArray(dump)).toBe(true)
        expect(dump.length).toBe(0);
        
        // you can mutate the returned array, but...
        dump.push('foo');
        expect(dump.length).toBe(1);

        // your changes will not be persisted in the universe
        const dump2 = universe.dump();
        expect(dump2.length).toBe(0)
      })
    })

    describe('.appendDelta', () => {
      it('is a function', () => {expect(typeof universe.appendDelta).toBe('function')})
      it('adds a delta to the universe', () => {
        const delta = { id: 'a', foo: 42, pointers: [] }
        universe.appendDelta(delta);
        const dump = universe.dump()

        expect(dump[0]).toEqual(delta)
      });

      it('automatically rebuilds the indexes to reflect the new delta', () => {
        const delta = { id: 'a', foo: 42, pointers: [] }
        universe.appendDelta(delta);

        const result = universe.lookup_by_id(delta.id);
        expect(result).toEqual(delta)
      })
    });

    describe('.appendDeltas', () => {
      it('is a function', () => {expect(typeof universe.appendDeltas).toBe('function')})
      it('adds a set of deltas to the universe', () => {
        const delta1 = { id: 'a', foo: 42, pointers: [] }
        const delta2 = { id: 'b', foo: 31, pointers: [] }
        universe.appendDeltas([delta1, delta2]);
        const dump = universe.dump()

        expect(dump[0]).toEqual(delta1)
        expect(dump[1]).toEqual(delta2)
      });

      it('automatically rebuilds the indexes to reflect the new deltas', () => {
        const delta1 = { id: 'a', foo: 42, pointers: [] }
        const delta2 = { id: 'b', foo: 31, pointers: [] }
        universe.appendDeltas([delta1, delta2]);

        const result1 = universe.lookup_by_id(delta1.id);
        expect(result1).toEqual(delta1)

        const result2 = universe.lookup_by_id(delta2.id);
        expect(result2).toEqual(delta2)
      })
    })

    describe('.addIndex', () => {
      it('is a function', () => {expect(typeof universe.addIndex).toBe('function')})
      it('builds the new index immediately against existing data', () => {
        const delta1 = { id: 'a', foo: 42, pointers: [] }
        let name = 'idsByFoo'
        let rule = canon => canon.reduce((acc, val) => {
          if (!acc[val.foo]) {
            acc[val.foo] = [];
          }
          acc[val.foo].push(val.id)
          return acc;
        }, {})
        
        universe.appendDelta(delta1);
        universe.addIndex(name, rule);
        const output = universe.lookup(name, 42)
        expect(output[0]).toBe(delta1.id)
        expect(output.length).toBe(1)
      })

      it('rebuilds the index every time new data is added', () => {
        const delta1 = { id: 'a', foo: 42, pointers: [] }
        const delta2 = { id: 'b', foo: 31, pointers: [] }
        const delta3 = { id: 'c', foo: 42, pointers: [] }

        let name = 'idsByFoo'
        let rule = canon => canon.reduce((acc, val) => {
          if (!acc[val.foo]) {
            acc[val.foo] = [];
          }
          acc[val.foo].push(val.id)
          return acc;
        }, {})

        universe.appendDelta(delta1);
        universe.addIndex(name, rule);
        universe.appendDeltas([delta2, delta3])

        const output = universe.lookup(name, 42)
        expect(output[0]).toBe(delta1.id)
        expect(output[1]).toBe(delta3.id)
        expect(output.length).toBe(2)
      })
    });

    describe('.removeIndex', () => {
      let name, rule;
      beforeEach(() => {
        name = 'idsByFoo'
        rule = canon => canon.reduce((acc, val) => {
          if (!acc[val.foo]) {
            acc[val.foo] = [];
          }
          acc[val.foo].push(val.id)
          return acc;
        }, {})

        const delta1 = { id: 'a', foo: 42, pointers: [] }
        const delta2 = { id: 'b', foo: 31, pointers: [] }        
        const delta3 = { id: 'c', foo: 42, pointers: [] }
        universe.appendDeltas([delta1, delta2, delta3])
        universe.addIndex(name, rule)
      })
      it('is a function', () => {expect(typeof universe.removeIndex).toBe('function')})
      it('removes the named index', () => {
        expect(universe.lookup(name, 42).length).toBe(2)
        universe.removeIndex(name)
        expect(universe.lookup(name, 42)).toBeNull()
      })
    });

    describe('lookup', () => {
      let delta;
      beforeEach(() => {
        delta = {id: 'a', foo: 42, pointers: []}
        universe.appendDelta(delta)
      })
      it('is a function', () => {expect(typeof universe.lookup).toBe('function')})      
      it('returns the value of the given key on the named index', () => {        
        result = universe.lookup('deltas_by_id', 'a');
        expect(result).toEqual(delta)
      })
      it('returns null if the named index does not exist', () => {
        result = universe.lookup('wrong_name', 'a');
        expect(result).toBeNull()
      })      
    });

    describe('lookup_by_id', () => {
      let delta;
      beforeEach(() => {
        delta = {id: 'a', foo: 42, pointers: []}
        universe.appendDelta(delta)
      })
      it('is a function', () => {expect(typeof universe.lookup_by_id).toBe('function')})
      it('binds .lookup to the "deltas_by_id" index', () => {
        expect(universe.lookup_by_id('a')).toEqual(delta)
      })
    });

    describe('name helpers', () => {
      // utility to make it easier to keep track of the mutable names of things
      // all deltas in test cases should be generated from core, really.
      beforeEach(() => {
        universe.appendDeltas([
          { id: 'a', pointers: [] }, // will have one name
          { id: 'b', pointers: [] }, // will have two names
          { id: 'c', pointers: [] }, // will have no names
          { id: 'x', pointers: [      // this assigns the name 'foo' to the entity with the id 'a'
            { id: guids.pointers.name, target: 'foo', property: guids.properties.things_with_this_name },
            { id: guids.pointers.named, target: 'a', property: guids.properties.names }
          ]},
          { id: 'y', pointers: [      // this assigns the name 'foo' to the entity with the id 'b'
            { id: guids.pointers.name, target: 'foo', property: guids.properties.things_with_this_name },
            { id: guids.pointers.named, target: 'b', property: guids.properties.names }
          ]},
          { id: 'z', pointers: [      // this assigns the name 'bar' to the entity with the id 'b'
            { id: guids.pointers.name, target: 'bar', property: guids.properties.things_with_this_name },
            { id: guids.pointers.named, target: 'b', property: guids.properties.names }
          ]}
        ]);
      })
      
      describe('lookup_ids_for_name', () => {
        it('binds lookup to the "ids_by_name" index', () => {
          expect(universe.lookup_ids_for_name('foo')).toEqual(['a', 'b'])
          expect(universe.lookup_ids_for_name('bar')).toEqual(['b'])
        })
      })
  
      describe('lookup_names_from_id', () => {
        it('binds lookup to the "names_by_id" index', () => {
          expect(universe.lookup_names_from_id('a')).toEqual(['foo'])
          expect(universe.lookup_names_from_id('b')).toEqual(['foo', 'bar'])
        })
      })
    })
  })
})