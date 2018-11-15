const gql = require("graphql-tag").default;

module.exports = {
  initialize: custom_defs => gql`

      scalar DateTime

      type ShallowNode {
        id: String!
        timestamp: DateTime!
        pointers: [ShallowPointer]
      }

      type ShallowPointer {
        id: String!
        target: ShallowNode!
        property: String!
      }
      
      ${custom_defs.types}

      # the schema allows the following query:
      type Query {
        shallow_nodes: [ShallowNode]
        shallow_node(id: String): ShallowNode
        ${custom_defs.queries}
      }
    `
};
