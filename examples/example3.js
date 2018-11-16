console.log("DeltaDog Demo - Example 3 - Temporal Lensing");
// This example is almost identical to the previous one, but it involves a temporal predicate.

const gql = require("graphql-tag").default;
const DD = require("../src");
const { pointers } = DD.guids;
const { predicates } = DD.utils;
const { universe, timestamps } = require("./__init");

// let's define some custom types and resolvers, just to show how this can work:
const custom_typedefs = {
  types: `
      type Painting {
        id: String!
        title: String!
        currently_owned_by: String!
      }
  `,
  queries: `paintings(cutoff:DateTime): [Painting]`
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
  paintings: (_, variables) => {
    const cutoff = variables.cutoff;
    return universe.dump() // all deltas
      .filter(predicates.setsOwnership) // only those deltas that set ownership
      .filter(cutoff ? predicates.isBefore(cutoff) : () => true) // temporal queries!
      .map(getPaintingData) // returns { painting_id, owner_id }
      .reduce(deduplicator, {}) // lol @ performance here
      .map(format(universe));
  }
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

const last_timestamp = new Date(timestamps.t2);
const cutoff = new Date(
  last_timestamp.setHours(last_timestamp.getHours() - 1)
).toISOString();

// But, we can time travel! Let's do the same query with a cutoff:
const query2 = gql`
  query($cutoff: DateTime) {
    paintings(cutoff: $cutoff) {
      id
      title
      currently_owned_by
    }
  }
`;

deltaStore
  .query({
    query: query2,
    variables: { cutoff }
  })
  .then(result => console.dir(result.data));
