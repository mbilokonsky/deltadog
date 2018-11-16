const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const SchemaLink = require("apollo-link-schema").SchemaLink;
const ApolloClient = require("apollo-client").ApolloClient;

const initialize_typedefs = require("./typedefs").initialize;
const initialize_resolvers = require("./resolvers").initialize;
const makeExecutableSchema = require("graphql-tools").makeExecutableSchema;

const cache = new InMemoryCache();

module.exports = {
  initialize: (
    universe,
    typedef_customizations = { types: "", queries: "" },
    resolver_customizations = _ => {}
  ) => {
    const typeDefs = initialize_typedefs(typedef_customizations);
    const resolvers = initialize_resolvers(universe, resolver_customizations);
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    return new ApolloClient({
      link: new SchemaLink({ schema }),
      cache
    });
  }
};
