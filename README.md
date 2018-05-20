# DELTA DOG
Delta Dog is a tool for tracking changes to the state of a given system. Rather than focusing on the current state at any time T, Delta Dog provides a formal semantics for focusing on each individual state transition as a first-class object.

**NOTE: this codebase is not a fully implementation of this idea. This has been prepared as a proof-of-concept to explain the way this kind of system can work. Should full work begin, the actual implementation is going to be a lot more robust.**

This approach means that materialized views can be generated at query-time, rather than defined in advance. It also means that queries over the way the system has changed over time become not only possible but easy.

Take a look at `pre-DD.js` for a starting point. This file contains a model of the art market, where we have a few paintings, a gallery, and a few collectors. It shows a simple example of a collector purchasing a painting using a variety of imperative, untracked state transitions in order to generate a new state.

Then take a look at `example.js`, which models the same art market with the same domain objects but which captures every state transition. This enables declatative, _relational_ updates to the entire system at once. It also enables arbitrary read-time formatting and, in case that wasn't enough, the ability to perform temporal queries (e.g. 'run this same query but pretend you were running at at time t1 instead of t2').


## Next Steps

This is so far just a toy implementation, mostly, though it already exposes some tremendous power.

Subsequent work should happen around the following tasks sooner than later:
  1. True immutability in the store, rather than the janky freeze/clone stuff I'm doing.
  2. Types would be great and would really help make this code more readable. Super excited to try to convert this to TS.
  3. We need the ability to append negations - this is straightforward, there's a new kind of relationship that can negate a previous relationship (and optionally replace it by pointing to a new one!). The integration logic could then seamlessly handle filters and redirects around this.
  4. This is really chaotic code to work in without a good set of utility functions to help you generate your deltas and another set to help you perform queries and format them. I wrote some basic utility functions, but all of this needs to be formalized and tested and new utility functions should be easy enough to spin out.
  5. All of these obvs needs some refactoring love. :)