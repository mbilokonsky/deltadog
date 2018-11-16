const utils = require('../../utils')
const { properties } = require("../../guids");
const _ = require('lodash')

const getNameAndId = delta => {
  let id = _.find(delta.pointers, v => v.property === properties.names).target
  let name = _.find(delta.pointers, v => v.property === properties.things_with_this_name).target
  return { name, id }
}

module.exports = canon => canon
  .filter(utils.predicates.setsName)
  .reduce((index, delta) => {
    const {name, id} = getNameAndId(delta)
    if (!index[name]) { index[name] = [] }
    index[name].push(id);
    return index;
  }, {})
