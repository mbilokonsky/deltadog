module.exports = canon => canon.reduce((index, delta) => {
                            index[delta.id] = delta;
                            return index;
                          }, {})
