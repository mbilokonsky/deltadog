# DELTA DOG
Delta Dog is a tool for tracking changes to the state of a given system. Rather than focusing on the current state at any time T, Delta Dog provides a formal semantics for focusing on each individual state transition as a first-class object.

**NOTE: this codebase is not a fully implementation of this idea. This has been prepared as a proof-of-concept to explain the way this kind of system can work. Should full work begin, the actual implementation is going to be a lot more robust.**

This approach means that materialized views can be generated at query-time, rather than defined in advance. It also means that queries over the way the system has changed over time become not only possible but easy.

Take a look at `pre-DD.js` for a starting point. This file contains a model of the art market, where we have a few paintings, a gallery, and a few collectors. It shows a simple example of a collector purchasing a painting using a variety of imperative, untracked state transitions in order to generate a new state.

Then take a look at `example.js`, which models the same art market with the same domain objects but which captures every state transition. This enables declatative, _relational_ updates to the entire system at once. It also enables arbitrary read-time formatting and, in case that wasn't enough, the ability to perform temporal queries (e.g. 'run this same query but pretend you were running at at time t1 instead of t2').


