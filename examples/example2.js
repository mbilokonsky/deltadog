console.log("DeltaDog Demo - Example 2 - Custom Lensing Over Delta Space");
// This example shows how we can define custom schemas and resolvers to coerce the data into whatever form we want.

const gql = require("graphql-tag").default;
const DD = require("../src");
const { pointers, properties } = DD.guids;
const { predicates, readers } = DD.utils;
const initial_state = require("./__init");

// all of our examples will start with the same initial conditions
const by_guid = initial_state.by_guid;

// let's define some custom types and resolvers, just to show how this can work:
const custom_typedefs = {
  types: `
      type Painting {
        id: String!
        title: String!
        currently_owned_by: String!
      }
  `,
  queries: `paintings: [Painting]`
};

const getPaintingData = entity =>
  entity.pointers.reduce(
    (acc, val) => {
      if (val.id === pointers.commodity) {
        acc.painting_id = val.target;
      }

      if (val.id === pointers.buyer) {
        acc.owner_id = val.target;
      }

      return acc;
    },
    { painting_id: null, owner_id: null }
  );

const deduplicator = (acc, val, index, src) => {
  acc[val.painting_id] = val;

  if (index === src.length - 1) {
    return Object.values(acc);
  }

  return acc;
};

const format = store => ({ painting_id, owner_id }) => ({
  id: painting_id,
  title: readers.getName(store)(painting_id) || "untitled",
  currently_owned_by: readers.getName(store)(owner_id)
});

const custom_resolvers = store => ({
  paintings: _ =>
    Object.values(store) // all deltas
      .filter(predicates.setsOwnership) // only those deltas that set ownership
      .map(getPaintingData) // returns { painting_id, owner_id }
      .reduce(deduplicator, {}) // lol @ performance here
      .map(format(store))
});

const deltaStore = DD.createStore(by_guid, custom_typedefs, custom_resolvers);

const query = gql`
  query {
    paintings {
      id
      title
      currently_owned_by
    }
  }
`;

deltaStore.query({ query }).then(result => {
  console.log("Here's the current state of our system:");
  console.dir(result.data);
});
