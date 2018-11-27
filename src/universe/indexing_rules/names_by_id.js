const utils = require('../../utils')
const { pointers, properties } = require("../../guids");
const _ = require('lodash')

const getNameAndId = delta => {
  let id = delta.pointers[pointers.named].target
  let name = delta.pointers[pointers.name].target
  return { name, id }
}

module.exports = canon => canon
  .filter(utils.predicates.setsName)
  .reduce((index, delta) => {
    const {name, id} = getNameAndId(delta)
    if (!index[id]) { index[id] = [] }
    index[id].push(name);
    return index;
  }, {})
