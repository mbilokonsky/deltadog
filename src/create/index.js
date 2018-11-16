const { properties, pointers } = require("../guids");
const UUID = require("uuid");

const createPointer = (pointer, target, property) => ({
  id: pointer,
  target: target.id || target,
  property
});

const delta = opts =>
  Object.freeze({
    id: UUID.v4().toString(),
    timestamp: opts.timestamp || new Date().toISOString(),
    pointers: Object.freeze(opts.pointers || []),
    properties: {}
  });

const nameRelationship = (ref, name, opts) =>
  delta({
    ...opts,
    pointers: [
      createPointer(pointers.name, name, properties.things_with_this_name),
      createPointer(pointers.named, ref, properties.names)
    ]
  });

const containmentRelationship = (parent, child, opts) =>
  delta({
    ...opts,
    pointers: [
      createPointer(pointers.parent, parent, properties.children),
      createPointer(pointers.child, child, properties.parents)
    ]
  });

const moneyAssignment = (entity, amount, opts) =>
  delta({
    ...opts,
    pointers: [
      createPointer(pointers.money_target, entity, properties.money),
      createPointer(pointers.money_amount, amount, properties.NULL)
    ]
  });

const ownershipRelationship = (owner, object, opts) =>
  delta({
    ...opts,
    pointers: [
      createPointer(pointers.buyer, owner, properties.collection),
      createPointer(pointers.commodity, object, properties.transactions)
    ]
  });

// hmm, ideally we should be able to compose `createMoneyAssignment` and `createOwnershipRelationship` to dynamically generate this function?
const saleRelationship = (buyer, seller, commodity, price, opts) =>
  delta({
    ...opts,
    pointers: [
      createPointer(pointers.money_amount, price, properties.NULL),
      createPointer(pointers.money_target, seller, properties.money),
      createPointer(pointers.money_source, buyer, properties.money),

      createPointer(pointers.commodity, commodity, properties.transactions),
      createPointer(pointers.buyer, buyer, properties.collection),
      createPointer(pointers.seller, seller, properties.collection)
    ]
  });

module.exports = {
  delta,
  nameRelationship,
  containmentRelationship,
  moneyAssignment,
  ownershipRelationship,
  saleRelationship
};
