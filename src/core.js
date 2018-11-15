const { properties, pointers } = require("./guids");
const UUID = require("uuid");

const createPointer = (pointer, target, property) => ({
  id: pointer,
  target: target.id || target,
  property
});

const createDelta = opts =>
  Object.freeze({
    id: UUID.v4().toString(),
    timestamp: opts.timestamp || new Date().toISOString(),
    pointers: Object.freeze(opts.pointers || []),
    properties: {},
    $debug: Object.freeze(opts.$debug || ""),
    $tags: Object.freeze(opts.$tags || [])
  });

const createNameRelationship = (ref, name, opts) =>
  createDelta({
    ...opts,
    pointers: [
      createPointer(pointers.name, name, properties.things_with_this_name),
      createPointer(pointers.named, ref, properties.names)
    ]
  });

const createContainmentRelationship = (parent, child, opts) =>
  createDelta({
    ...opts,
    pointers: [
      createPointer(pointers.parent, parent, properties.children),
      createPointer(pointers.child, child, properties.parents)
    ]
  });

const createMoneyAssignment = (entity, amount, opts) =>
  createDelta({
    ...opts,
    pointers: [
      createPointer(pointers.money_target, entity, properties.money),
      createPointer(pointers.money_amount, amount, properties.NULL)
    ]
  });

const createOwnershipRelationship = (owner, object, opts) =>
  createDelta({
    ...opts,
    pointers: [
      createPointer(pointers.buyer, owner, properties.collection),
      createPointer(pointers.commodity, object, properties.transactions)
    ]
  });

// hmm, ideally we should be able to compose `createMoneyAssignment` and `createOwnershipRelationship` to dynamically generate this function?
const createSaleRelationship = (buyer, seller, commodity, price, opts) =>
  createDelta({
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
  createDelta,
  createNameRelationship,
  createContainmentRelationship,
  createMoneyAssignment,
  createOwnershipRelationship,
  createSaleRelationship
};
