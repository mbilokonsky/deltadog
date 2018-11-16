const write = require('../../src/universe/write.js')
describe('universe writer', () => {
  let delta1 = {id: 'foo'}
  let delta2 = {id: 'bar'}
  let canon = []
  
  beforeEach(() => {
    canon = []
  })

  describe('.appendDelta', () => {
    let subject, reindex;
    beforeEach(() => {
      reindex = jest.fn()
      subject = write.appendDelta(canon, reindex)
    })

    it('is a function', () => {
      expect(typeof write.appendDelta).toBe('function')
    })

    it('returns a function', () => {
      expect(typeof subject).toBe('function')
    })

    describe('behavior', () => {
      it('adds the input delta to the canon', () => {
        subject(delta1);
        expect(canon[0]).toBe(delta1)
      })

      it('calls the provided reindex function', () => {
        subject(delta1)
        expect(reindex).toHaveBeenCalledTimes(1)
      })

      pending('requires the input to be a single delta', () => {

      })
    })
  })
  describe('.appendDeltas', () => {
    let subject, reindex;
    beforeEach(() => {
      reindex = jest.fn()
      subject = write.appendDeltas(canon, reindex)
    })
    
    it('is a function', () => {
      expect(typeof write.appendDeltas).toBe('function')
    })
    
    it('returns a function', () => {
      expect(typeof subject).toBe('function')
    })

    describe('behavior', () => {
      it('adds the input deltas to the canon', () => {
        subject([delta1, delta2]);
        expect(canon[0]).toBe(delta1)
        expect(canon[1]).toBe(delta2)
      })

      it('calls the provided reindex function', () => {
        subject([delta1, delta2])
        expect(reindex).toHaveBeenCalledTimes(1)
      })

      pending('requires the input to be an array of deltas', () => {

      })
    })
  })
})