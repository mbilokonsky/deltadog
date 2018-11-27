const { properties, pointers } = require("../guids");
const UUID = require("uuid");

const createPointer = (target, property) => ({
  target: target.id || target,
  property
});

const delta = opts =>
  Object.freeze({
    id: UUID.v4().toString(),
    timestamp: opts.timestamp || new Date().toISOString(),
    pointers: Object.freeze(opts.pointers || {}),
    properties: {}
  });

const nameRelationship = (ref, name, opts) =>
  delta({
    ...opts,
    pointers: {
      [pointers.name]: createPointer(name, properties.things_with_this_name),
      [pointers.named]: createPointer(ref, properties.names)
    }
  });

const containmentRelationship = (parent, child, opts) =>
  delta({
    ...opts,
    pointers: {
      [pointers.parent]: createPointer(parent, properties.children),
      [pointers.child]: createPointer(child, properties.parents)
    }
  });

const moneyAssignment = (entity, amount, opts) =>
  delta({
    ...opts,
    pointers: {
      [pointers.money_target]: createPointer(entity, properties.money),
      [pointers.money_amount]: createPointer(amount, properties.NULL)
    }
  });

const ownershipRelationship = (owner, object, opts) =>
  delta({
    ...opts,
    pointers: {
      [pointers.buyer]: createPointer(owner, properties.collection),
      [pointers.commodity]: createPointer(object, properties.transactions)
    }
  });

// hmm, ideally we should be able to compose `createMoneyAssignment` and `createOwnershipRelationship` to dynamically generate this function?
const saleRelationship = (buyer, seller, commodity, price, opts) =>
  delta({
    ...opts,
    pointers: {
      [pointers.money_amount]: createPointer(price, properties.NULL),
      [pointers.money_target]: createPointer(seller, properties.money),
      [pointers.money_source]: createPointer(buyer, properties.money),
      [pointers.commodity]: createPointer(commodity, properties.transactions),
      [pointers.buyer]: createPointer(buyer, properties.collection),
      [pointers.seller]: createPointer(seller, properties.collection)
    }
  });

module.exports = {
  delta,
  nameRelationship,
  containmentRelationship,
  moneyAssignment,
  ownershipRelationship,
  saleRelationship
};
