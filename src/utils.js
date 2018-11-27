const { pointers } = require("./guids");

/* Predicates */
const hasPointer = pointer_id => entity => !!entity.pointers[pointer_id]  

const targetsEntity = targetId => entity =>
  Object.values(entity.pointers).some(p => p.target === targetId);

const setsOwnership = hasPointer(pointers.commodity);
const setsName = hasPointer(pointers.name);
const setsMoney = hasPointer(pointers.money_amount)

const isBefore = timestamp => entity =>
  new Date(entity.timestamp) < new Date(timestamp);

module.exports = {
  predicates: {
    hasPointer,
    setsOwnership,
    setsName,
    targetsEntity,
    isBefore,
    setsMoney
  }
};
