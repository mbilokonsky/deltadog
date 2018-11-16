const GraphQLDateTime = require("graphql-iso-date").GraphQLDateTime;

module.exports = {
  initialize: (universe, custom_resolvers) => ({
    DateTime: GraphQLDateTime,
    Query: {
      shallow_nodes: _ => {
        return universe.dump();
      },
      shallow_node: id => universe.lookup_by_id(id),
      ...custom_resolvers(universe)
    }
  })
};
