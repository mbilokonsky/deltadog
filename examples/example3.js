console.log("DeltaDog Demo - Example 3 - Temporal Lensing");
// This example is almost identical to the previous one, but it involves a temporal predicate.

const gql = require("graphql-tag").default;
const DD = require("../src");
const { pointers } = DD.guids;
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

const format = store => ({ painting_id, owner_id }) => ({
  id: painting_id,
  title: readers.getName(store)(painting_id) || "untitled",
  currently_owned_by: readers.getName(store)(owner_id)
});

const custom_resolvers = store => ({
  paintings: (_, variables) => {
    const cutoff = variables.cutoff;
    return Object.values(store) // all deltas
      .filter(predicates.setsOwnership) // only those deltas that set ownership
      .filter(cutoff ? predicates.isBefore(cutoff) : () => true) // temporal queries!
      .map(getPaintingData) // returns { painting_id, owner_id }
      .reduce(deduplicator, {}) // lol @ performance here
      .map(format(store));
  }
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

const last_timestamp = new Date(initial_state.timestamps.t2);
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
