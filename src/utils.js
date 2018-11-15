const { pointers, properties } = require("./guids");

/* Predicates */
const hasPointer = pointer_id => entity =>
  entity.pointers.some(p => p.id === pointer_id);
const targetsEntity = targetId => entity =>
  entity.pointers.some(p => p.target === targetId);

const setsOwnership = hasPointer(pointers.commodity);
const setsName = hasPointer(pointers.name);

const isBefore = timestamp => entity =>
  new Date(entity.timestamp) < new Date(timestamp);

/* readers */
const extractName = entity =>
  entity.pointers.reduce((acc, val) => {
    if (acc) {
      return acc;
    }
    if (val.id === pointers.name) {
      return val.target;
    }
    return acc;
  }, "");

const getName = store => id =>
  Object.values(store) // all deltas
    .filter(setsName) // all deltas that set a name anywhere
    .filter(targetsEntity(id)) // all deltas that set a name anywhere and target our input entity
    .map(extractName) // extract the value of the name pointer
    .reduce((acc, val) => {
      // reduce it to a single name if multiple exist
      if (acc) return acc;
      return val;
    });

module.exports = {
  predicates: {
    hasPointer,
    setsOwnership,
    setsName,
    targetsEntity,
    isBefore
  },
  readers: {
    getName // lossy, returns the first name it finds
  }
};
