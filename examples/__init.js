// @ts-check
const { 
  delta, 
  saleRelationship, 
  nameRelationship, 
  moneyAssignment, 
  ownershipRelationship
} = require("../src").create;

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
  painting1: delta({ $debug: "mona lisa", timestamp }),
  painting2: delta({ $debug: "the scream", timestamp }),
  gallery: delta({ $debug: "gallery", timestamp }),
  collector1: delta({ $debug: "collector1", timestamp }),
  collector2: delta({ $debug: "collector2", timestamp })
};

// now let's assign some properties to the members of our domain
const initial_state = [
  // assign names to paintings, collectors and the gallery
  nameRelationship(domain.painting1, "mona lisa", { timestamp }),
  nameRelationship(domain.painting2, "the scream", { timestamp }),
  nameRelationship(
    domain.gallery,
    "Suspiciously Well Stocked Gallery",
    { timestamp }
  ),
  nameRelationship(domain.collector1, "Sally Smith", { timestamp }),
  nameRelationship(domain.collector2, "Judas Jones", { timestamp }),

  // establish ownership over the two paintings
  ownershipRelationship(domain.gallery, domain.painting1, { timestamp }),
  ownershipRelationship(domain.gallery, domain.painting2, { timestamp }),

  // set a bank balance for each stakeholder.
  moneyAssignment(domain.gallery, 1000, { timestamp }),
  moneyAssignment(domain.collector1, 500, { timestamp }),
  moneyAssignment(domain.collector2, 2000, { timestamp })
];

const t2 = advanceTimestamp();
// So that's cool! What does that let us do? Well, let's sell a painting.
const after_one_sale = [
  saleRelationship(
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
