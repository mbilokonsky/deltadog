const deltas_by_id =  require('./indexing_rules/deltas_by_id')
const ids_by_name = require('./indexing_rules/ids_by_name')
const names_by_id = require('./indexing_rules/names_by_id')

module.exports = {
  initialize: canon => {
    const rules = {}
    let indices = {}
    
    const addRule = (name, build) => {
      rules[name] = build
      indices[name] = build(canon)
    }

    const deleteRule = name => {
      delete rules[name];
      delete indices[name];
    }
    
    const rebuild = () => {
      indices = Object.keys(rules).reduce((idxs, rule_name) => {
        idxs[rule_name] = rules[rule_name](canon)
        return idxs
      }, {})
    }

    const lookup = (index_name, key) => {
      const index = indices[index_name]
      if(!index) return null
      return index[key]
    }
    const listRules = () => Object.keys(rules)

    // default: start with an index by id
    addRule('deltas_by_id', deltas_by_id)

    // default: start with ids by name
    addRule('ids_by_name', ids_by_name)

    // default: start with names by id
    addRule('names_by_id', names_by_id)

    return {
      rebuild,
      addRule,
      deleteRule,
      lookup,
      listRules
    }
  }
}