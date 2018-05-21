const DD = require('./src');
const guids = DD.guids;

// this is just to format our output;
let count = 1;
const log = (title, message) => console.log(`\n#${count++}: ${title}`, message, '\n-------');

// first, let's create our universe of facts.
const timestamp = Date.now();
const universe = {
    painting1: DD.createDelta({$debug: 'mona lisa', timestamp}),
    painting2: DD.createDelta({$debug: 'the scream', timestamp}),
    gallery: DD.createDelta({$debug: 'gallery', timestamp}),
    collector1: DD.createDelta({$debug: 'collector1', timestamp}),
    collector2: DD.createDelta({$debug: 'collector2', timestamp})
}

// now let's assign some properties to the members of our universe
const initial_state = [
    // assign names to paintings, collectors and the gallery
    DD.createNameRelationship(universe.painting1, 'mona lisa', {timestamp, $debug: 'name painting1'}),
    DD.createNameRelationship(universe.painting2, 'the scream', {timestamp, $debug: 'name painting2'}),
    DD.createNameRelationship(universe.gallery, 'Suspiciously Well Stocked Gallery', {timestamp, $debug: 'name gallery'}),
    DD.createNameRelationship(universe.collector1, 'Sally Smith', {timestamp, $debug: 'name collector1'}),
    DD.createNameRelationship(universe.collector2, 'Judas Jones', {timestamp, $debug: 'name collector2'}),
    
    // establish ownership over the two paintings
    DD.createOwnershipRelationship(universe.gallery, universe.painting1, {timestamp, $debug: 'set initial ownership of painting 1'}),
    DD.createOwnershipRelationship(universe.gallery, universe.painting2, {timestamp, $debug: 'set initial ownership of painting 2'}),
    
    // set a bank balance for each stakeholder.
    DD.createMoneyAssignment(universe.gallery, 1000, {timestamp, $debug: 'set initial gallery money'}),
    DD.createMoneyAssignment(universe.collector1, 500, {timestamp, $debug: 'set initial collector1 money'}),
    DD.createMoneyAssignment(universe.collector2, 2000, {timestamp, $debug: 'set initial collector2 money'}),
];

// flatten this down into a single array of deltas.
const all_deltas = [
    universe.painting1, 
    universe.painting2, 
    universe.gallery, 
    universe.collector1, 
    universe.collector2,
].concat(initial_state);

// we now have this big whole mess of individual deltas:
log('all deltas', all_deltas);


// We can `integrate` our entire graph into a DAG with our root entity as our initial starting point.
// This gives us the gallery delta with all of the deltas that point to it nested under it.

// SPECIAL NOTE 1: this toy example doesn't do it, but DD will support deep-nesting of deltas/entities
// in this example we're only going one level deep.

// SPECIAL NOTE 2: this is an example implementation, and the integration logic requires a total ordering of inputs
// in order to work. A more robust implementation would be able to accept deltas whose time stamps are all out of order
// and would use higher order logic to figure out ordering.

// given this initial starting point, if we want to see the current state of the gallery we would expect to see something like:
// { name: 'Suspiciously Well Stocked Gallery', collection: [ mona_lisa, the_scream ], money: 1000}

// but if we're using the DeltaDog view, we get something a bit more complex:
const gallery = DD.integrate(universe.gallery, all_deltas);
log('gallery - lossless', gallery);

// same for the collector - it's not just our simple JSON objects
let collector1 = DD.integrate(universe.collector1, all_deltas);
log('collector1 - lossless', collector1);

// we'll revisit collectors later - for now let's focus on the gallery.

// So far our view into the gallery is lossless with respect to the gallery - we're including all deltas
// that inform what gallery is, but at query-time we don't really want this lossless view because it's really hard to
// work with. So let's flatten it down!
const flat_gallery = DD.flatten(gallery);
log('gallery - flat', flat_gallery);

// We're getting there! But we can do a little bit better if we add some custom formatting rules.
// We have this tool called `integration_rules.js` and it attempts to provide a structured way
// to do what we want.

// We can pass a customized rules engine into our flatten function to make our output
// look more like something we want to work with. Currently it's using the default formatter
// and the default property flattener. 

// first, let's just tweak the formatter. By default it's just inverting the keys and values
// of our properties object in guids.js. This is useful and gets us the string we use to refer
// to the guid in our code as a human readable name, but it has a few shortfalls:

// 1. We don't necessarily want to use variable names as canonical names, and
// 2. The only data available to it is the stuff hard-coded into guids.js, so it has 
//      no way to give names to the deltas we generated as we ran this. So instead, let's
//      just use our $debug string for naming:

const namesByGuid = all_deltas.reduce((acc, val) => {
    acc[val.id] = val.$debug;
    return acc;
}, {});

const rules = DD.createRulesEngine({ namesByGuid });
const formatted_flattened_gallery = DD.flatten(gallery, rules);
log('gallery - formatted:\n', formatted_flattened_gallery);

// this gets us almost there - but why are our values all nested arrays?
// well, think about it: this tool is designed to capture every state 
// change in your system, and the values of the properties of your object
// are derived from the set of deltas included in the universe of all facts.
// we can't know in advance how many deltas are going to be assigning value 
// to the same property, right? 

// someone else could at any time add a new delta to the system that would 
// overwrite other values, but we're not about that life here. We want all of it.

const t2 = timestamp + 10;
const state2 = [
    DD.createNameRelationship(universe.gallery, 'GalleryName2', {timestamp: t2, $debug: 'name gallery again'}),
]

const updatedGallery = DD.integrate(universe.gallery, all_deltas.concat(state2));
const formatted_flattened_updated_gallery = DD.flatten(updatedGallery, rules);
log('gallery - with additional name', formatted_flattened_updated_gallery);

// As a result, we need to be willing to accept a plurality of values for every 
// field as the canonical 'truth'. However, our formatting engine can be tweaked 
// to let us flatten values according to whatever rules we want at read time.

// let's write a flattener for the 'name' property that'll always give us a single string,
// rather than an array of arrays of strings. For our example purposes, let's say that if some
// entity has multiple names set then the _correct_ name is the one that was set most recently.

// NOTE: this flattener can use any kind of logic it wants. Interpolate the strings, add them together, ignore them, whatever!

// A flattener looks like this:

const flattenToMostRecentName = (parent, property, deltas, formatID) => {
        const most_recent = deltas.reduce((acc, val) => {
            if (val.timestamp > acc.timestamp) {
                return val;
            }

            return acc;
        }, {timestamp: 0});

        const {target} = most_recent.pointers[guids.pointers.name];
        return target;
    };

// We just need to write a custom reconciler - that looks like this:
const reconciler = {
    getFlattener: (parent, property) => {
        if (property === guids.properties.names) {
            return {flatten: flattenToMostRecentName.bind(null, parent, property)};
        }
    }
}

const rules_2 = DD.createRulesEngine({
    namesByGuid,
    reconciler
});

const formatted_flattened_updated_gallery_with_flattened_name = DD.flatten(updatedGallery, rules_2);
log('gallery - formatted with custom name logic', formatted_flattened_updated_gallery_with_flattened_name);

// things get a bit more interesting when we care about money. Since we'll be keeping track
// of every state change, rather than maintaining a running balance, we just have to make 
// sure that our financial flattener understands when to increment and when to decrement
// a value.

const flattenMoneyBalance = (parent, property, deltas, formatID) => {
    const value = deltas.reduce(get_money_reducer(parent), 0);
    return `$${value}`;
};

const get_money_reducer = parent => {
    return (running_total, delta) => {
        // the logic is as follows: each delta contains some pointers that describe
        // a financial transaction. We're going to iterate over every financial
        // transaction delta that targets our parent, and then keep track of whether
        // our balance goes up or down as a result of that transaction.
        const magnitude = delta.pointers[guids.pointers.money_amount].target;
        const money_source_pointer = delta.pointers[guids.pointers.money_source];
        const money_destination_pointer = delta.pointers[guids.pointers.money_target];

        const money_source = money_source_pointer ? money_source_pointer.target : null;
        const money_destination = money_destination_pointer ? money_destination_pointer.target : null;

        if (parent.id === money_destination) { 
            return running_total + magnitude;
        }
        
        if (parent.id === money_source) { 
            return running_total - magnitude; 
        }

        return running_total;
    }
}

// so let's flesh out our reconciler a little bit:

const reconciler2 = {
    getFlattener: (parent, property) => {
        if (property === guids.properties.names) {
            return { flatten: flattenToMostRecentName.bind(null, parent, property) };
        }

        if (property === guids.properties.money) {
            return { flatten: flattenMoneyBalance.bind(null, parent, property) };
        }        
    }
}

const rules_3 = DD.createRulesEngine({
    namesByGuid,
    reconciler: reconciler2
});

const formatted_flattened_updated_gallery_with_flattened_name_and_summed_money = DD.flatten(updatedGallery, rules_3);
log('gallery + money logic', formatted_flattened_updated_gallery_with_flattened_name_and_summed_money);

const t3 = timestamp + 50;
// So that's cool! What does that let us do? Well, let's sell a painting.
const state3=[
    DD.createSaleRelationship(
        universe.collector1.id, 
        universe.gallery.id,
        universe.painting1.id,
        100,
        {timestamp: t3, $debug: 'gallery sold painting 1 to collector 1 for 100 dollars'}
    )
]

const gallery_after_sale = DD.integrate(universe.gallery, 
    all_deltas
        .concat(state2)
        .concat(state3)
);

const post_sale_flattened = DD.flatten(gallery_after_sale, rules_3);
log('gallery - post-sale', post_sale_flattened);

// So hey that's kind of cool - we saw that our gallery's money balance increased,
// even though we haven't manually taught our flattener how to handle a SaleRelationship!

// however, it looks like our 'collection' flattener isn't sure how to handle the 6-dimensional
// delta that represents the sale - so far we've only used binary deltas, so our 'value' is 
// just 'give me the target of the pointer on the delta that isn't pointing at me'. Now, 
// our sale relationship delta is pointing at a bunch of different stuff all at once. 

// let's see if we can clean that up!

const reconciler3 = {
    getFlattener: (parent, property) => {
        if (property === guids.properties.names) {
            return { flatten: flattenToMostRecentName.bind(null, parent, property) };
        }

        if (property === guids.properties.money) {
            return { flatten: flattenMoneyBalance.bind(null, parent, property) };
        }   
        
        if (property === guids.properties.collection) {
            return { flatten: flattenArtCollection.bind(null, parent, property) };
        }
    }
}

const flattenArtCollection = (parent, property, deltas, formatID) => {
    const value = deltas.reduce(get_art_collection_reducer(parent, formatID), []);
    return value;
};

const get_art_collection_reducer = (parent, formatID) => {
    return (acc, delta) => {
        // so, we're now going to be iterating over all deltas that target the 
        // 'collection' property on any given entity. 

        // so far we have two different kinds of deltas that reference art ownership,
        // `createOwnershipRelationship` and `createSaleRelationship` - but both use 
        // the `pointers.buyer` to reference ownership, so we should be able to generalize
        // a single flattening reduction

        // what is the piece of art whose ownership is transitioning?
        const commodity = delta.pointers[guids.pointers.commodity].target;
        const formatted_commodity = formatID(commodity);

        // who is the new owner?
        const new_owner = delta.pointers[guids.pointers.buyer].target;
        const formatted_owner = formatID(new_owner);

        let formatted_seller = 'nobody';
        const seller_reference = delta.pointers[guids.pointers.seller];
        if (seller_reference) {
            formatted_seller = formatID(seller_reference.target);
        }

        // console.log('DELTA:', `${formatted_seller} sold ${formatted_commodity} to ${formatted_owner} as of ${delta.timestamp}`)

        // remember we're flattening with respect to some owner, here. If the new_owner
        // is our parent, then include the painting in our result. Otherwise leave it out.
        if (new_owner === parent.id) {  
            return [...acc, formatted_commodity];
        } else {
            return acc.filter(i => i !== formatted_commodity);
        }
    }
}

const rules_4 = DD.createRulesEngine({
    namesByGuid,
    reconciler: reconciler3
});

const post_sale_flattened_with_ownership_transfer = DD.flatten(gallery_after_sale, rules_4);
log('gallery - post-sale + ownership transfer', post_sale_flattened_with_ownership_transfer);

// cool, so now our flattened gallery view correctly integrates the sale delta.
// this is kind of a big deal because that one delta handled otherwise separate
// imperative state updates. But DeltaDog is fundamentally relational - each delta is an
// n-dimensional relation capable of updating state across the entire universe in a single
// operation.

// to put it another way, let's flatten collector1 and see what shakes out!

const stream = all_deltas.concat(state2).concat(state3);
collector1 = DD.integrate(universe.collector1, stream);
const collector1_flat = DD.flatten(collector1, rules_4);

log('collector1 - post-sale + ownership transfer', collector1_flat)


// neat, right? But it gets better! Because we are materializing the view at query time
// we can actually control what shakes out by filtering what deltas we accept! So, shall 
// we time-travel?

const filter_by_time = delta => delta.timestamp <= t2;
const filtered_deltas = stream.filter(filter_by_time);
const back_to_the_future = {
    gallery: DD.flatten(DD.integrate(universe.gallery, filtered_deltas), rules_4),
    collector1: DD.flatten(DD.integrate(universe.collector1, filtered_deltas), rules_4)
}

log('gallery + collector, with time travel', back_to_the_future);

// Ok so we've been focusing on collectors and galleries so far, but given the state of our system as described by `stream`
// what do we know about our paintings?

const monalisa = DD.integrate(universe.painting1, stream);
const flat_mona = DD.flatten(monalisa, rules_4);

log('mona after sale', flat_mona);

// So that's weird, we have a name and a `transactions` property but we don't have, like, an owner, or a price history, exactly.
// Can we write some flattening rules to build out the view that we want, given this underlying data?

const reconciler4 = {
    getFlattener: (parent, property) => {
        if (property === guids.properties.names) {
            return { flatten: flattenToMostRecentName.bind(null, parent, property) };
        }

        if (property === guids.properties.money) {
            return { flatten: flattenMoneyBalance.bind(null, parent, property) };
        }   
        
        if (property === guids.properties.collection) {
            return { flatten: flattenArtCollection.bind(null, parent, property) };
        }

        if (property === guids.properties.transactions) {
            return { flatten: flattenTransactions.bind(null, parent, property) };
        }
    }
}

const flattenTransactions = (parent, property, deltas, formatID) => 
    deltas.reduce(get_transaction_flattener(parent, formatID), []);

const get_transaction_flattener = (parent, formatID) => {
    return (acc, delta) => {
        // so, we're now going to be iterating over all deltas that target the 
        // 'collection' property on any given entity. 

        // so far we have two different kinds of deltas that reference art ownership,
        // `createOwnershipRelationship` and `createSaleRelationship` - but both use 
        // the `pointers.buyer` to reference ownership, so we should be able to generalize
        // a single flattening reduction

        // what is the piece of art whose ownership is transitioning?
        const commodity = delta.pointers[guids.pointers.commodity].target;
        const formatted_commodity = formatID(commodity);

        // who is the new owner?
        const new_owner = delta.pointers[guids.pointers.buyer].target;
        const formatted_owner = formatID(new_owner);

        // who is the old owner?
        const old_owner = delta.pointers[guids.pointers.seller];
        const formatted_seller = old_owner ? formatID(old_owner.target) : '<nobody>'

        const money_amount = delta.pointers[guids.pointers.money_amount];
        const price = money_amount ? money_amount.target : 0;

        const tx = {
            buyer: formatted_owner,
            seller: formatted_seller,
            price,
            timestamp: delta.timestamp,
            id: delta.id,
        }

        acc.push(tx);
        return acc;        
    }
}

const rules_5 = DD.createRulesEngine({
    namesByGuid,
    reconciler: reconciler4
});

const flat_mona_with_tx = DD.flatten(monalisa, rules_5);

log('mona with tx history', flat_mona_with_tx);

// This is neat! Can we do one better, though? I see that transaction history but I'd love, for instance, to have some other fields derived from our transaction log.
// Let's use a post-flattening function to do one final transform to our materialized view.

const painting_post_flattener = painting => {
    if (!painting.transactions) { return painting; }
    painting.max_price = painting.transactions.reduce((acc, val) => {
        return Math.max(acc, val.price)
    }, Number.MIN_SAFE_INTEGER);

    painting.min_price = painting.transactions.reduce((acc, val) => {
        return Math.min(acc, val.price);
    }, Number.MAX_SAFE_INTEGER);

    painting.average_price = painting.transactions.reduce((acc, val, index, collection) => {
        const total = acc + val.price;
        if (index === collection.length - 1) { return total / collection.length } // compute the mean
        
        return total;
    }, 0);

    delete painting.transactions;

    return painting;
}

const reconciler5 = {
    getFlattener: reconciler4.getFlattener,
    getPostFlattener: () => painting_post_flattener
}

const rules_6 = DD.createRulesEngine({
    namesByGuid,
    reconciler: reconciler5
});

const bonus_mona = DD.flatten(monalisa, rules_6);
log('mona with derived fields', bonus_mona);