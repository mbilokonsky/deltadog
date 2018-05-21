const guids = require('./guids');
const default_names = Object.entries(guids.properties)
  .reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
  });


const defaultFlattener = (parent, property, deltas, formatID) => deltas.reduce(
  (acc, {pointers}) => {     
    const flattened = Object
      .values(pointers)
      .filter(({target, _}) => target !== parent.id)
      .map(({target, _}) => formatID(target));
    
    acc.push(flattened);
    return acc;
  }, [])

const defaultReconciler = {
  getFlattener: (parent, property) => ({
    flatten: defaultFlattener.bind(null, parent, property)
  }),
  getPostFlattener: () => flat => flat
}

module.exports = {
  createRulesEngine: ({ namesByGuid, reconciler = defaultReconciler }) => {
    const formatID = id => {
      return namesByGuid[id] || default_names[id] || id;
    };

    const flattenDeltasForProperty = (parent, property, deltas) => {
      const flattener = reconciler.getFlattener(parent, property) 
        || defaultReconciler.getFlattener(parent, property);
        
        return flattener.flatten(deltas, formatID); 
    }

    const postFlattenTransform = flat => {
      let transform;
      if (reconciler.getPostFlattener) {
        transform = reconciler.getPostFlattener();
      } else {
        transform = defaultReconciler.getPostFlattener();
      } 
      return transform(flat);
    }

    return { formatID, flattenDeltasForProperty, postFlattenTransform }
  }
};