module.exports = {
  initialize: (universe, custom_typedefs, custom_resolvers) =>
    require("./graphql").initialize(universe, custom_typedefs, custom_resolvers)
};
