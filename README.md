# DELTA DOG
Delta Dog is a tool for tracking changes to the state of a given system. Rather than focusing on the current state at any time T, Delta Dog provides a formal semantics for focusing on each individual state transition as a first-class object.

**NOTE: this codebase is not a fully implementation of this idea. This has been prepared as a proof-of-concept to explain the way this kind of system can work. Should full work begin, the actual implementation is going to be a lot more robust.**

This approach means that materialized views can be generated at query-time, rather than defined in advance. It also means that queries over the way the system has changed over time become not only possible but easy.

Take a look at `pre-DD.js` for a starting point. This file contains a model of the art market, where we have a few paintings, a gallery, and a few collectors. It shows a simple example of a collector purchasing a painting using a variety of imperative, untracked state transitions in order to generate a new state.

Then take a look at `example.js`, which models the same art market with the same domain objects but which captures every state transition. This enables declatative, _relational_ updates to the entire system at once. It also enables arbitrary read-time formatting and, in case that wasn't enough, the ability to perform temporal queries (e.g. 'run this same query but pretend you were running at at time t1 instead of t2').

## Key Features
  1. Universal schema. All data that flows into Delta Dog looks exactly the same: it's just a stream of deltas, each of which has an identical schema.
  2. Idempotent functional transparent immutable pure etc: this implementation is pure functions and pure data structures.
  3. Arbitrary read-time complexity with minimal up-front cost: just inhale the changes into your system. Worry about what they mean later. Because DeltaDog is using a referentially transparent universal schema as expressed in deltas, every query returns a substream of deltas that can be organized into whatever shape you want _at query time_.
  4. This query-time complexity offers maximally granular control over what you get back out of the store. Your query can specify a filter operation to take place over the entire universe of deltas, so for instance you can trivially filter out `all deltas whose timestamp is > t1` or `all deltas created by Orta` (if we're tracking that in our metadata). The resulting substream can be piped into your query post-processing to coerce it into whatever shape you want.
  5. Deltas are technically 'hyper-edges' in an n-dimensional hyper-graph. (A hyper-graph is a graph whose hyper-edges are also nodes.) When we perform a query, we're saying 'return the graph starting with node X and follow all of the edges as I've instructed in my query.' This is neat because it means we get a lot of powerful graph analysis for free. (Graph theory is a well-defined discipline with lots of ways of exploring state; the ability to articulate state-over-time as a graph of changes means we can do really gnarly analyses that would just not be possible with standard BI tools.)

## Questions
I've been showing this to a few folks internally and here I want to collect up the various questions I've been asked by stakeholders:

  * **Orta: The hard thing for me to see is how does it know about all of these things, and would it be considered the canonical source for these kind of db writes? Or I guess, the root of my question is what does a migration path towards something like this look like?**

  So you’d have declarative files that define models for your domain, expressed in these terms. This is a layer we can add on top of what we have, nondestructively, if we are able to generate deltas by parsing a database write log, for instance.

  * **Sarah: how does this handle migrations/logic changes? (i.e. if we change a resolver, how can we both see what our history was when the logic was different and also make sure our results are up-to-date?)**

  The reconcilers are only ever applied at query time - you can in fact think of our custom reconciliation logic as a query builder. The data that's logged is always a flat stream of deltas.

  Migrations should happen relatively seamlessly - if a new field is added we just have to make sure we add the appropriate delta dog schema data so that it knows how to ingest it. Ideally there'll be a simple DSL or function for generating this.


  * **Sarah: does it take snapshots of state?**

  It can! The core abstraction is an ever-growing append-only list of deltas, but due to the way the schema works we can embed relationships into the things that they target, recursively, building out lossless materialized views which are then ready for flattening.

  It can be helpful to think of such a materialized view as just another delta, though. Any materialized view is a partial application of some deltas into some integration, but the resulting output entity can still be integrated into other deltas etc - this is because it's all a graph, right?

  * **Sarah: how do we manage complexity? (there are obvious wins, but it's definitely a very new paradigm and seems pertinent to mitigate the learning curve esp. if it's for a core system)**

  This is the million dollar question! The way we do it is by building out utility functions and abstractions to enable us to perform updates easily and imperatively on the surface but generating an immutable log of delta objects under the hood. Having an easy way to explore the universe of deltas without having to browse through mind-numbing JSON objects would be super helpful, too.

  One way to approach this is to say: nobody ever generates deltas manually. Instead, deltas are generated by consuming streams of database transaction logs using carefully-defined mappings between database schema and deltadog relations. Build some simple declarative tooling around that and boom, half of the complexity of working with this is resolved - at that point we can just focus on writing the exact query tools that we find useful. 

  * **Sarah: what would be some initial plans for a system like this? would the eventual goal be to replace our main data stores?**

  I definitely see a future where a system like this undergirds production databases everywhere. Martin Kleppman's talk "Turning the Database Inside Out" at Strangeloop '15 captures a bit of what such a world would look like: we acknowledge that state always has been and always will be an ephemeral byproduct of from reducing a stream of changes. What Delta Dog in particular aims to do is formalize what those changes can look like.

  So would this replace our main data stores? Maybe eventually, with a lot of buy-in. But definitely that's not where I want us to start!
  
  But the nice thing about this system is that it's not an all-or-nothing proposition. An initial rollout could do something like (1) consume our transaction log for art object sales over time, (2) generating a new delta (or delta set) for each database transaction, (3) index all generated deltas in some persistent store like redis, and (4) allow temporal queries over the captured history of our art sales.

  * **Sarah: random side question: if you actually had to build this right now, would you do it in javascript/typescript? or something like elixir?**

  ahhh great question! So one of my absolute favorite parts of this system is that it can be trivially implemented using pure functions and pure data structures. Ultimately we have defined a very simple struct, and then we just have operations that are applied over instances of this struct.

  What that means is that making this system language agnostic is trivial! It would be super easy, for instance, to generate deltas in elixir but then allow queries through javascript, or vice versa, etc. We could double-down on this by keeping our deltas in an arrow format, or protobuf, or something else that's a binary schema with adapters written in lots of languages.

  (Personally I like arrow for this because it gives us a straight shot at GPU computation...)

## Next Steps

This is so far just a toy implementation, mostly, though it already exposes some tremendous power.

Subsequent work should happen around the following tasks sooner than later:
  1. A delta store, in-memory by default but persistent if necessary, where deltas can be appended and read-back in an immutable way. (I'm doing some goofy faux-immutability in core.js)
  2. Types would be great and would really help make this code more readable. Super excited to add typescript.
  3. We need the ability to append negations - this is straightforward, there's a new kind of relationship that can negate a previous relationship (and optionally replace it by pointing to a new one!). The integration logic could then seamlessly handle filters and redirects around this.
  4. This is really chaotic code to work in without a good set of utility functions to help you generate your deltas and another set to help you perform queries and format them. I wrote some basic utility functions, but all of this needs to be formalized and tested and new utility functions should be easy enough to spin out.
  5. All of these obvs needs some refactoring love. :)