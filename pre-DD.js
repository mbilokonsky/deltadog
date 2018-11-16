// lets create some universe of facts - think of this as the canonical database.

const universe = {
    painting1: {
        name: 'mona lisa',        
    },

    painting2: {
        name: 'the scream',
    },

    gallery: {
        name: 'Suspiciously Well Stocked Gallery',
        collection: [],
        money: 1000
    },
    
    collector1: {
        name: 'Sally Smith',
        collection: [],
        money: 500
    },
    
    collector2: {
        name: 'Judas Jones',
        collection: [],
        money: 2000
    }
}

// let's establish ownership of the mona lisa within this universe
universe.gallery.collection.push(universe.painting1);
universe.gallery.collection.push(universe.painting2);

console.log('state0', universe);

// let's create the ability for galleries and collectors in our universe to exchange art for money
const purchase = (buyer, seller, piece, price) => {
    seller.collection = seller.collection.filter(i => i!=piece);
    buyer.collection.push(piece);

    buyer.money = buyer.money - price;
    seller.money = seller.money + price;
    
    // note we're not even tracking this transition with respect to the piece
    // itself - how would we? 
}

// we can then do all kinds of mutations, right?

purchase(universe.collector1, universe.gallery, universe.painting1, 200);
console.log('state1', universe);

// so that's my starting point. This is kind of what y'all do today, right? 
// This is how a lot of software works.
// but what if it could work a little differently? 
// run `npm run ex1`, `npm run ex2` and `npm run ex3` to see something different.

