// @ts-check
const { 
  createDelta, 
  createSaleRelationship, 
  createNameRelationship, 
  createMoneyAssignment, 
  createOwnershipRelationship
} = require("../src");

const universe = require('../src/universe').createUniverse();

// we gotta be able to control time, this is neat. :-D
let timestamp;
const advanceTimestamp = () => {
  var d = timestamp ? new Date(timestamp) : new Date();
  d.setHours(d.getHours() + 24);
  timestamp = d.toISOString();
  return timestamp;
};

// let's set our initial time
const t1 = advanceTimestamp()

// first, let's create some deltas to represent the nouns in our world
const domain = {
  painting1: createDelta({ $debug: "mona lisa", timestamp }),
  painting2: createDelta({ $debug: "the scream", timestamp }),
  gallery: createDelta({ $debug: "gallery", timestamp }),
  collector1: createDelta({ $debug: "collector1", timestamp }),
  collector2: createDelta({ $debug: "collector2", timestamp })
};

// now let's assign some properties to the members of our domain
const initial_state = [
  // assign names to paintings, collectors and the gallery
  createNameRelationship(domain.painting1, "mona lisa", { timestamp }),
  createNameRelationship(domain.painting2, "the scream", { timestamp }),
  createNameRelationship(
    domain.gallery,
    "Suspiciously Well Stocked Gallery",
    { timestamp }
  ),
  createNameRelationship(domain.collector1, "Sally Smith", { timestamp }),
  createNameRelationship(domain.collector2, "Judas Jones", { timestamp }),

  // establish ownership over the two paintings
  createOwnershipRelationship(domain.gallery, domain.painting1, { timestamp }),
  createOwnershipRelationship(domain.gallery, domain.painting2, { timestamp }),

  // set a bank balance for each stakeholder.
  createMoneyAssignment(domain.gallery, 1000, { timestamp }),
  createMoneyAssignment(domain.collector1, 500, { timestamp }),
  createMoneyAssignment(domain.collector2, 2000, { timestamp })
];

const t2 = advanceTimestamp();
// So that's cool! What does that let us do? Well, let's sell a painting.
const after_one_sale = [
  createSaleRelationship(
    domain.collector1.id,
    domain.gallery.id,
    domain.painting1.id,
    100,
    {
      timestamp
    }
  )
];

// flatten this down into a single array of deltas.
const all_deltas = [
  domain.painting1,
  domain.painting2,
  domain.gallery,
  domain.collector1,
  domain.collector2
].concat(initial_state, after_one_sale);

universe.appendDeltas(all_deltas)

module.exports = {
  universe,
  time: { t1, t2, advanceTimestamp }
};
