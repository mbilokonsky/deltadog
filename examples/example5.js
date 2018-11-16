console.log("DeltaDog Demo - Example 5 - Reduction at Scale?!");
const _ = require('lodash')
// This example is almost identical to the previous one, but it involves a temporal predicate.

const gql = require("graphql-tag").default;
const DD = require("../src");
const { pointers } = DD.guids;
const { predicates } = DD.utils;
const { universe, time, domain } = require("./__init");
const { utils, create } = DD

// let's define some custom types and resolvers, just to show how this can work:
const custom_typedefs = {
  types: `
      type Owner {
        name: String!
        balance: Int
      }

      type Painting {
        id: String!
        title: String!
        owner: Owner!
      }
  `,
  queries: `
    paintings: [Painting]
    owners: [Owner]
  `
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
    owner: {
      name: owner_names ? owner_names[0] : 'secret rando',
      balance: universe.lookup('balance_by_collector', owner_id)
    }
  }
};

// let's add an index so we can look up operations that change dollar values
const balance_by_collector = canon => canon
    .filter(utils.predicates.setsMoney)
    .reduce((acc, delta) => {
      const receiver_pointer = _.find(delta.pointers, v => v.id === pointers.money_target)
      const spender_pointer = _.find(delta.pointers, v => v.id === pointers.money_source)
      const amount_pointer = _.find(delta.pointers, v => v.id === pointers.money_amount)

      const receiver_id = receiver_pointer ? receiver_pointer.target : null
      const spender_id = spender_pointer ? spender_pointer.target : null
      const amount = amount_pointer ? amount_pointer.target : 0

      if (receiver_id) {
        if (!acc[receiver_id]) { acc[receiver_id] = 0 }
        acc[receiver_id] += amount;
      }

      if (spender_id) {
        if (!acc[spender_id]) { acc[spender_id] = 0 }
        acc[spender_id] -= amount;
      }

      return acc;
    }, {})

universe.addIndex('balance_by_collector', balance_by_collector);

const custom_resolvers = universe => ({
  paintings: _ => {
    return universe.dump() // all deltas
      .filter(predicates.setsOwnership) // only those deltas that set ownership
      .map(getPaintingData) // returns { painting_id, owner_id }
      .reduce(deduplicator, {}) // lol @ performance here
      .map(format(universe));
  }
});

const deltaStore = DD.createGraphQLStore(universe, custom_typedefs, custom_resolvers);

// But, we can time travel! Let's do the same query with a cutoff:
const query = gql`
  query {
    paintings {
      id
      title
      owner {
        name
        balance
      }
    }
    owners {
      name
      balance
    }
  }
`;

const current_owners = {
  [domain.painting1.id]: domain.collector1.id,
  [domain.painting2.id]: domain.gallery.id
}

const market = [
  domain.collector1.id,
  domain.collector2.id,
  domain.gallery.id
]

const getSalePair = (commodity) => {
  const seller = current_owners[commodity]
  const buyer = _.sample(market.filter(i => i !== seller))
  current_owners[commodity] = buyer;
  return { buyer, seller }
}

const populate_transaction_history = () => {
  const transactions = [];
  for (var i = 0; i < 1000; i++) {
    let commodity = Math.random() > .5 ? domain.painting1.id : domain.painting2.id
    let { buyer, seller } = getSalePair(commodity)
    let price = Math.floor(Math.random() * 200)    

    transactions.push(create.saleRelationship(
      buyer,
      seller,
      commodity,
      price
    ))
  }

  universe.appendDeltas(transactions)
}

populate_transaction_history();

deltaStore
  .query({ query })
  .then(result => {
    // graphQL
    console.log('\nPainting State:')
    results = result.data.paintings.map(p => `   Painting [${p.title}] is owned by ${p.owner.name} ($${p.owner.balance})`)
    console.log(results.join('\n'))
    
    // universe lookup
    console.log('\nCollector State')
    console.log(`   Gallery: `, universe.lookup('balance_by_collector', domain.gallery.id))
    console.log(`   Sally Smith: `, universe.lookup('balance_by_collector', domain.collector1.id))
    console.log(`   Judas Jones: `, universe.lookup('balance_by_collector', domain.collector2.id))
  });


