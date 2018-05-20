module.exports = {
    properties: {
        NULL: 'e188355e-7a93-4ed2-9c67-ce41060fb68d',
        names:  '50dc5e41-25ac-4470-9ddd-60701dbcd915',                         // the field under which an object's names are stored
        things_with_this_name: '53646285-e294-40a2-afc4-5738a2bf70a5',          // the field under which all things that use a given X as a name are store
        parents: 'c4f83539-8a08-4560-8711-f9fb0ad6aba7',                        // the field on a given contained object that links to its container.
        children: '95fcdc6f-17aa-4a2b-85ae-4b2d8eea8c84',                       // the field on a given container object that links to its children
        money: 'bf6f669b-f6c8-45e5-88ad-b6cc916d8c47',
        transactions: '79cca8dd-122e-426a-ac4d-d78952315083',
        collection: '2c9784b5-7f3f-4ff3-83bc-d1144b21f66d',
        owner: 'b7896542-385e-408c-bb63-61a5084e6f1d' 
    },
    pointers: {
        name: '5556d4bc-7e55-4e04-a35e-178e90e6b7d0',           // this points to a string to be used as a name
        named: '91106b13-e40b-4873-8dac-d90222fd04e8',          // this points to a thing that gets a name
        parent: '9004ab00-2ea4-4844-a375-640571717c7a',         // this points to a parent container
        child: '90dcfafc-b9ba-4ca9-b7f8-9c111109f8ce',          // this points to a child container,
        money_target: 'ed8245fa-b1f9-4177-a69c-464ac2ad95e2',
        money_source: '11849c65-0340-4309-9fc5-c8fe750e7c9b',
        money_amount: '44e588c1-10cf-43fe-b084-fb3fc06e987e',
        commodity: '8430ff49-2adc-4bc4-871d-60e795238fe7',
        buyer: '12459d17-ee5c-4b4f-875f-fdf684146ec5',
        seller: '855444bd-c8da-4a47-bd76-7cdfc8656e33'
    },
    
}