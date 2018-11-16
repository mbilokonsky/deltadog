# DELTA DOG
Delta Dog is a tool for tracking changes to the state of a given system. Rather than focusing on the current state at any time T, Delta Dog provides a formal semantics for focusing on each individual state transition as a first-class object.

**NOTE: this project is still in proof-of-concept stage. Use it at your peril, but please do play with it and see what you think!**

This approach means that materialized views can be generated at query-time, rather than defined in advance. It also means that queries over the way the system has changed over time become not only possible but easy.

The examples I'm using have been drawn from day to day life as a software engineer at Artsy, where we often have to reason about things like the price of a piece of art over time. As a result, the demos are all focused on transitions of that nature, as well as virtualizing arbitrary views derivable from the set of deltas we're working with.

Take a look at `pre-DD.js` for a starting point. This file contains a model of the art market, where we have a few paintings, a gallery, and a few collectors. It shows a simple example of a collector purchasing a painting using a variety of imperative, untracked state transitions in order to generate a new state.

Then take a look at the stuff in `examples/`, which models the same art market with the same domain objects but which captures every state transition. This enables declarative, _relational_ updates to the entire system at once. It also enables arbitrary read-time formatting and, in case that wasn't enough, the ability to perform temporal queries (e.g. 'run this same query but pretend you were running at at time t1 instead of t2').

## Key Features
  1. Universal schema. All data that flows into Delta Dog looks exactly the same: it's just a stream of deltas, each of which has an identical schema. This makes iteration and replay fast, but I haven't even started optimizations around this. One really nice thing about universal schema is that computers are really good at huge operations against rows in a homogenous table.
  2. Idempotent functional transparent immutable pure etc: this implementation is pure functions and pure data structures. 
  3. Arbitrary read-time complexity with minimal up-front cost: just inhale the changes into your system. Worry about what they mean later. Because DeltaDog is using a referentially transparent universal schema as expressed in deltas, every query returns a substream of deltas that can be organized into whatever shape you want _at query time_.
  4. This query-time complexity offers maximally granular control over what you get back out of the store. Your query can specify a filter operation to take place over the entire universe of deltas, so for instance you can trivially filter out `all deltas whose timestamp is > t1` or `all deltas created by Orta` (if we're tracking that in our metadata). The resulting substream can be piped into your query post-processing to coerce it into whatever shape you want.
  5. Deltas are technically 'hyper-edges' in an n-dimensional hyper-graph. (A hyper-graph is a graph whose nodes are never directly connected via an edge - instead, each node connects directly to one or more hyper-edges, which then connect to other nodes. It's like a normal graph but you can treat your edges as nodes.) When we perform a query, we're saying 'return the graph starting with node X and follow all of the edges as I've instructed in my query.' This is neat because it means we get a lot of powerful graph analysis for free. (Graph theory is a well-defined discipline with lots of ways of exploring state; the ability to articulate state-over-time as a graph of changes means we can do really gnarly analyses that would just not be possible with standard BI tools.)
  6. Because this gives us the ability to granularly control change over time, writing tests against data in this system becomes much, much easier than more standard testing. Because the entire system is deterministic - because all output states are a direct function of input deltas - you can create sets of deltas that represent specific universes of truth and against which you can make reliable and deterministic assertions. You can then mutate your state by adding or removing deltas, and update your tests accordingly.

## Updates
  1. Cleaned this up to use a well-defined `universe` as the baseline delta store. This universe maintains an array of all deltas, as well as 3 useful indexes. Application developers can add their own additional indexes to the universe to maintain views. Right now the indexing implementation in particular is laughably naive - we simply replay the entire universe every time a new delta is added, which allows us to rebuild all of the indexes. At scale this will obviously need to be cleaned up, but for an in-memory store it works.
  2. Added GraphQL support! This is still in its infancy but there's now a GraphQL query layer sitting on top of the universe. The idea is that users should be able to express their arbitrarily complex queries using GraphQL's syntax. Right now the baked-in support is minimal, but it is extensible as you can see in `examples/example2.js` and example 3 - we build a custom schema, attach it to a custom resolver and use them to get a view into our state.

## Next Steps

This is so far just a toy implementation, mostly, though it already exposes some tremendous power.

Subsequent work should happen around the following tasks sooner than later:
  1. Composing deltas and maintaining rolling indexes - one of the most useful features of this model is the ability to embed deltas inside of other deltas, to build out a tree by materializing references. We shouldn't have to fully rebuild all indexes from scratch every time a new delta is appended to the universe. Some indexes, sure - if it's a lossy view, a rollup of value over time or something, then yeah, we have to rebuild it. But using snapshots for indexing is really powerful, and we should do that.
  2. I have a baseline graphQL model in place, but the baked-in settings need to do more. Every delta type expressed in `src/create` should have a corresponding query type defined in graphQL, with a default resolver.
  3. We currently support querying the universe for a shallow view of a given entity, but once (1) and (2) above is done we'll need to provide a way to query for deep views. The mechanism is fairly straightforward, and GraphQL gives us one way to do it by default - but really the mechanism needs to be something like `universe.query(root, schema)` where the schema is a recursively defined structure that tells the universe (1) which pointers it should care about in the associated node, and (2) which sub-schemas it should apply to the values of those pointers. (This is literally what GraphQL gives us, I just think we should have some way to do it without GraphQL too - but this may be the wrong place to be reasoning about this.)
  4. We need the ability to append negations - this is straightforward, there's a new kind of relationship that can negate a previous relationship (and optionally replace it by pointing to a new one!). The integration logic could then seamlessly handle filters and redirects around this.
  5. This is really chaotic code to work in without a good set of utility functions to help you generate your deltas and another set to help you perform queries and format them. I wrote some basic utility functions, but all of this needs to be formalized and tested and new utility functions should be easy enough to spin out.
  6. I'm considering a more simplified approach where names are treated as immutable and unique so that we can use them as IDs. This would make it much more readable to look at a given delta and understand what it means, but it requires controls to avoid duplicating names. Because a core value proposition of DeltaDog is the ability to merge and slice data sets at will, reducing what remains, it becomes very difficult to ensure name uniqueness - this is why we use GUIDs. Still, for something like a flux store, this may be the way to go, at least for domain objects and pointer/property names.