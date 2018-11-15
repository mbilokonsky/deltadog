// @ts-check
const DD = require("../src");

// first, let's create our universe of facts.
const timestamp = new Date().toISOString();
const universe = {
  painting1: DD.createDelta({ $debug: "mona lisa", timestamp }),
  painting2: DD.createDelta({ $debug: "the scream", timestamp }),
  gallery: DD.createDelta({ $debug: "gallery", timestamp }),
  collector1: DD.createDelta({ $debug: "collector1", timestamp }),
  collector2: DD.createDelta({ $debug: "collector2", timestamp })
};

// now let's assign some properties to the members of our universe
const initial_state = [
  // assign names to paintings, collectors and the gallery
  DD.createNameRelationship(universe.painting1, "mona lisa", {
    timestamp,
    $debug: "name painting1"
  }),
  DD.createNameRelationship(universe.painting2, "the scream", {
    timestamp,
    $debug: "name painting2"
  }),
  DD.createNameRelationship(
    universe.gallery,
    "Suspiciously Well Stocked Gallery",
    { timestamp, $debug: "name gallery" }
  ),
  DD.createNameRelationship(universe.collector1, "Sally Smith", {
    timestamp,
    $debug: "name collector1"
  }),
  DD.createNameRelationship(universe.collector2, "Judas Jones", {
    timestamp,
    $debug: "name collector2"
  }),

  // establish ownership over the two paintings
  DD.createOwnershipRelationship(universe.gallery, universe.painting1, {
    timestamp,
    $debug: "set initial ownership of painting 1"
  }),
  DD.createOwnershipRelationship(universe.gallery, universe.painting2, {
    timestamp,
    $debug: "set initial ownership of painting 2"
  }),

  // set a bank balance for each stakeholder.
  DD.createMoneyAssignment(universe.gallery, 1000, {
    timestamp,
    $debug: "set initial gallery money"
  }),
  DD.createMoneyAssignment(universe.collector1, 500, {
    timestamp,
    $debug: "set initial collector1 money"
  }),
  DD.createMoneyAssignment(universe.collector2, 2000, {
    timestamp,
    $debug: "set initial collector2 money"
  })
];

var last = timestamp;
const advanceTimestamp = () => {
  var d = new Date(last);
  d.setHours(d.getHours() + 24);
  last = d.toISOString();
  return last;
};

const t2 = advanceTimestamp();
// So that's cool! What does that let us do? Well, let's sell a painting.
const after_one_sale = [
  DD.createSaleRelationship(
    universe.collector1.id,
    universe.gallery.id,
    universe.painting1.id,
    100,
    {
      timestamp: t2,
      $debug: "gallery sold painting 1 to collector 1 for 100 dollars"
    }
  )
];

// flatten this down into a single array of deltas.
const all_deltas = [
  universe.painting1,
  universe.painting2,
  universe.gallery,
  universe.collector1,
  universe.collector2
].concat(initial_state, after_one_sale);

module.exports = {
  by_guid: all_deltas.reduce((acc, val) => {
    acc[val.id] = val;
    return acc;
  }, {}),
  timestamps: { t1: timestamp, t2 }
};
