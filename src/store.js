const reader = require('./reader');

const executeQuery = (query, state) => {
    const { stateFilter = x=>true, root, rules, postProcess } = query;
    const newState = Object.values(state).filter(stateFilter);
    const integratedView = reader.integrate(root, newState);
    const flattenedView = reader.flatten(integratedView, rules);
    return postProcess(flattenedView);
}

const createStore = opts => {
    const deltasById = {};
    
    return {
        write: delta => deltasById[delta.id] = delta,
        writeBatch: batch => batch.forEach(delta => deltasById[delta.id] = delta),
        get: id => deltasById[id],
        query: query => exectueQuery(query, deltasById),
        dump_data: () => JSON.parse(JSON.stringify(deltasById))
    }
};