const {properties, pointers} = require('./guids');
const UUID = require('uuid');

const createPointer = (target, property) => ({ target: target.id || target, property });

const createDelta = (opts) => Object.freeze({
    id: UUID.v4(),
    timestamp: opts.timestamp || Date.now(),
    pointers: Object.freeze(opts.pointers || {}),
    properties: {},
    $debug: Object.freeze(opts.$debug || ''),
    $tags: Object.freeze(opts.$tags || [])
});

const createNameRelationship = (ref, name, opts) => createDelta({
    ...opts,        
    pointers: {
        [pointers.name]: createPointer(name, properties.things_with_this_name),
        [pointers.named]: createPointer(ref, properties.names)
    } 
})

const createContainmentRelationship = (parent, child, opts) => createDelta({
    ...opts,
    pointers: {
        [pointers.parent]: createPointer(parent, properties.children),
        [pointers.child]: createPointer(child, properties.parents)
    }
});

const createMoneyAssignment = (entity, amount, opts) => createDelta({
    ...opts,
    pointers: {
        [pointers.money_target]: createPointer(entity, properties.money),
        [pointers.money_amount]: createPointer(amount, properties.NULL)
    }
})

const createOwnershipRelationship = (owner, object, opts) => createDelta({
    ...opts,
    pointers: {
        [pointers.buyer]: createPointer(owner, properties.collection),
        [pointers.commodity]: createPointer(object, properties.owner)
    }
})

const createSaleRelationship = (buyer, seller, commodity, price, opts) => createDelta({
    ...opts,
    pointers: {
        [pointers.money_amount]: createPointer(price, properties.NULL),
        [pointers.money_target]: createPointer(seller, properties.money),
        [pointers.money_source]: createPointer(buyer, properties.money),

        [pointers.commodity]: createPointer(commodity, properties.transactions),
        [pointers.buyer]: createPointer(buyer, properties.collection),
        [pointers.seller]: createPointer(seller, properties.collection),        
    }
})

module.exports = {
    createDelta,
    createNameRelationship,
    createContainmentRelationship,
    createMoneyAssignment,
    createOwnershipRelationship,
    createSaleRelationship
}