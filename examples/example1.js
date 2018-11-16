console.log("DeltaDog Demo - Example 1 - Shallow View Over Delta Space");

const gql = require("graphql-tag").default;
const DD = require("../src");

// all of our examples will start with the same initial conditions
const { universe } = require("./__init")

// let's create a simple deltastore with default schema information
const deltaStore = DD.createGraphQLStore(universe);

// let's query out each of our nodes, as well as its pointers.
const query = gql`
  query {
    shallow_nodes {
      id
      timestamp
      pointers {
        id
        target
        property
      }
    }
  }
`;

deltaStore.query({ query }).then(result => {
  console.log("\n\nHere's the current state of our system:");
  console.log('(you are seeing a lossless relational view, this should feel weird and confusing)')
  console.log(JSON.stringify(result.data.shallow_nodes, null, 2))
});