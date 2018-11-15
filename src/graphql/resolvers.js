const GraphQLDateTime = require("graphql-iso-date").GraphQLDateTime;
const { predicates } = require("../utils");

module.exports = {
  initialize: (store, custom_resolvers) => ({
    DateTime: GraphQLDateTime,
    Query: {
      shallow_nodes: _ => {
        return Object.values(store);
      },
      shallow_node: id => store[id],
      ...custom_resolvers(store)
    }
  })
};
