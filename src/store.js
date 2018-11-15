module.exports = {
  initialize: (data, custom_typedefs, custom_resolvers) =>
    require("./graphql").initialize(data, custom_typedefs, custom_resolvers)
};
