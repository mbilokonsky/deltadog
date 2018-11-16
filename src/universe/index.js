// This file represents the 'universe' within which the deltas live.
// The universe should be directly queryable in a quick, synchronous way
// The universe is meant to be consumed by a structured reader, like our GraphQL implementation
const write = require('./write');
const indexer = require('./index_engine')

const createUniverse = () => {
  
  // this holds all of our deltas. 100% of everything can be rederived from this.
  const canon = [];
  
  const dump = () => JSON.parse(JSON.stringify(canon));

  // this lets us index arbitrary data by arbitrary keys
  const indexing_engine = indexer.initialize(canon)
  const appendDelta = write.appendDelta(canon, indexing_engine.rebuild);
  const appendDeltas = write.appendDeltas(canon, indexing_engine.rebuild);
  
  const lookup_by_id = indexing_engine.lookup.bind(null, 'deltas_by_id')
  const lookup_names_from_id = indexing_engine.lookup.bind(null, 'names_by_id')
  const lookup_ids_for_name = indexing_engine.lookup.bind(null, 'ids_by_name')
  
  return {
    dump,
    appendDelta,
    appendDeltas,
    addIndex: indexing_engine.addRule,
    removeIndex: indexing_engine.deleteRule,
    lookup: indexing_engine.lookup,
    lookup_by_id,
    lookup_names_from_id,
    lookup_ids_for_name
  }
}

module.exports = {
  createUniverse
}