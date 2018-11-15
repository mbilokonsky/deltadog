console.log("DeltaDog Demo - Example 1 - Shallow View Over Delta Space");

const gql = require("graphql-tag").default;
const DD = require("../src");

// all of our examples will start with the same initial conditions
const by_guid = require("./__init").by_guid;

// let's create a simple deltastore with default schema information
const deltaStore = DD.createStore(by_guid);

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

deltaStore.query({ query }).then(result => console.dir(result.data));
