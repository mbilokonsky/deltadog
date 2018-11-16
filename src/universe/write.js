module.exports = {
  appendDelta: (canon, reindex) => delta => {
    canon.push(delta)
    reindex()
  },
  appendDeltas: (canon, reindex) => deltas => {
    deltas.forEach(d => canon.push(d))
    reindex()
  }
}