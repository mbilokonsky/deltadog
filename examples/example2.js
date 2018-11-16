console.log("DeltaDog Demo - Example 2 - Custom Lensing Over Delta Space");
// This example shows how we can define custom schemas and resolvers to coerce the data into whatever form we want.

const gql = require("graphql-tag").default;
const DD = require("../src");
const { pointers } = DD.guids;
const { predicates } = DD.utils;
const { universe } = require("./__init")


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

const format = universe => ({ painting_id, owner_id }) => {
  const titles = universe.lookup_names_from_id(painting_id)
  const owner_names = universe.lookup_names_from_id(owner_id)
  return {
    id: painting_id,
    title: titles ? titles[0] : "untitled",
    currently_owned_by: owner_names ? owner_names[0] : 'secret rando'
  }
};

const custom_resolvers = universe => ({
  paintings: _ =>
    universe.dump() // all deltas
      .filter(predicates.setsOwnership) // only those deltas that set ownership
      .map(getPaintingData) // returns { painting_id, owner_id }
      .reduce(deduplicator, {}) // lol @ performance here
      .map(format(universe))
});

const deltaStore = DD.createStore(universe, custom_typedefs, custom_resolvers);

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
