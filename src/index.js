const core = require("./core");
const reader = require("./reader");
const rules_util = require("./integration_rules");
const store = require("./store");

module.exports = {
  createDelta: core.createDelta,
  createNameRelationship: core.createNameRelationship,
  createContainmentRelationship: core.createContainmentRelationship,
  createMoneyAssignment: core.createMoneyAssignment,
  createSaleRelationship: core.createSaleRelationship,
  createOwnershipRelationship: core.createOwnershipRelationship,
  integrate: reader.integrate,
  flatten: reader.flatten,
  createRulesEngine: rules_util.createRulesEngine,
  createStore: store.initialize,
  guids: require("./guids"),
  universe: require('./universe'),
  utils: require("./utils")
};
