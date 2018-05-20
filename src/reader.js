const guids = require('./guids');
const default_rules = require('./integration_rules').createRulesEngine({
    namesByGuid: Object.entries(guids.properties).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    })
})

const clone = x => JSON.parse(JSON.stringify(x))
const reducer = (env, delta) => {
    Object
        .entries(delta.pointers)
        .forEach(([pointer_id, pointer]) => {
            const target = env[pointer.target];             // are we targeting something that we have a reference to?
            if (!target) {                                  // if not, bail! No problem!
                return; 
            }                        
            
            if (!target.properties[pointer.property]) {     // if we do have a reference to our target, does it have the extrinsic field we're targeting already defined?
                target.properties[pointer.property] = [];   // if not, create an array to represent it. (Note: Delta Dog must use vector values for extrinsic fields, because graphs.)            
            }
            
            target.properties[pointer.property].push(delta);// finally, nest our delta under the extrinsic field on that entity that it's targeting.
        })
    
    env[delta.id] = Object.freeze(clone(delta));   // add our delta to our final environment
    return env;
}


const integrate = (root, deltas) => deltas.reduce(reducer, { [root.id]: clone(root)})[root.id];

const flatten = (parent, rules = default_rules) => Object
    .entries(parent.properties)
    .reduce((flat, [property_id, deltas]) => {
        const property_name = rules.formatID(property_id);
        const property_value = rules.flattenDeltasForProperty(parent, property_id, deltas);
        flat[property_name] = property_value;
        return flat;
    }, {});

module.exports = {
    integrate,
    flatten
}