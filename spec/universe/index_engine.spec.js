const subject = require('../../src/universe/index_engine');

describe('universe index engine', () => {
  it ('defines an initialize function', () => {
    expect(typeof subject.initialize).toBe('function')
  })

  describe('index_engine', () => {
    let canon, engine;
    beforeEach(() => {
      canon = [
        {id: 'a', foo: 1, pointers: []},
        {id: 'b', foo: 2, pointers: []},
        {id: 'c', foo: 3, pointers: []}
      ]
      engine = subject.initialize(canon)
    })

    describe('listRules', () => {
      it('is a function', () => {
        expect(typeof engine.listRules).toBe('function');
      })

      it('returns an array of names of active rules', () => {
        rule_names = engine.listRules();
        expect(rule_names.length).toBe(3);
        // it should have 3 indexes by default
        expect(rule_names[0]).toBe('deltas_by_id');
        expect(rule_names[1]).toBe('ids_by_name')
        expect(rule_names[2]).toBe('names_by_id')
      })
    })

    describe('lookup', () => {
      it('is a function', () => {
        expect(typeof engine.lookup).toBe('function')
      });

      it('returns the value for key under the named index', () => {
        result = engine.lookup('deltas_by_id', 'b')
        expect(result).toBe(canon[1])
      })
    })

    describe('rebuild', () => {
      it('is a function', () => {
        expect(typeof engine.rebuild).toBe('function');
      })

      it('rebuilds the indices to reflect the current canon', () => {
        const new_delta = {id: 'x', foo: 30, pointers: []}
        canon.push(new_delta)
        expect(engine.lookup('deltas_by_id', 'x')).toBe(undefined)
        engine.rebuild();
        expect(engine.lookup('deltas_by_id', 'x')).toBe(new_delta);
      })
    });

    describe('addRule', () => {
      it('is a function', () => {
        expect(typeof engine.addRule).toBe('function');
      })

      describe('after invocation', () => {
        let name, rule;
        beforeEach(() => {
          name = 'fooByCharCode'
          rule = canon => canon.reduce((acc, val) => { 
            acc[val.id.charCodeAt(0)] = val.foo
            return acc;
          }, {})

          engine.addRule(name, rule)
        })

        it('immediately adds a named index', () => {
          expect(engine.listRules().indexOf(name)).not.toBe(-1)
        })

        it('immediately builds that index', () => {
          expect(engine.lookup(name, canon[1].id.charCodeAt(0))).toBe(canon[1].foo)
        });
      })
    })

    describe('deleteRule', () => {
      it('is a function', () => {
        expect(typeof engine.deleteRule).toBe('function');
      })

      it('removes a rule by name', () => {
        expect(engine.listRules().length).toBe(3)
        engine.deleteRule('deltas_by_id')
        expect(engine.listRules().length).toBe(2)
      })
    })
  })
});