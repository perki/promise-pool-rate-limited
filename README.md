# Promise pool with rate limiting for Node.js

![tests](https://github.com/perki/promise-pool-rate-limited/actions/workflows/test.js.yml/badge.svg) [![npm](https://img.shields.io/npm/v/promise-pool-rate-limited)](https://www.npmjs.com/package/promise-pool-rate-limited) [![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

Super simple, depency-less

When you need to execute a very large number of Promises to be created "on the fly", but you must comply to maximum concurrent and and/or maximum call rate.

This is mostly useful when  

What you need at least: 

- a `next()` function that returns the next Promise to execute or `false` when done
- a `maxConcurent`value 

Options are 
- `rateHz` the maximum number of calls per seconds
- `onError` to eventually catch error and the faulty promise

### Simple Exemple

Fetch items with id from 1 to 100000 from an API with a maximum concurrent calls of 10;
```javascript
const PromisePoolRL = require('promise-pool-rate-limited');

async getAll() {
  let i = 0;

  await PromisePoolRL(next, 10);

  function next() {
    if (i === 100000) return false; // done;
    i++;
    return async function() {
      const content =(await (await fetch(`https://api.co/${id}`).text());
      // ... do something with the content
    }
  }
}

getAll();
```

### Exemple with rate limiting 

Fetch items with id from 1 to 100000 from an API with 

- a maximum concurrent calls of 10 
- a maximum of 20 calls per seconds

```javascript
const PromisePoolRL = require('promise-pool-rate-limited');

async getAll() {
  let i = 0;

  await PromisePoolRL(next, 10, {rateHz: 20});

  function next() {
    if (i === 100000) return false; // done;
    i++;
    return async function() {
      const content=(await (await fetch(`https://api.co/${id}`).text());
      // ... do something with the content
    }
  }
}

getAll();
```



### Exemple with error catching

By default if one of the promise calls fails, the sequence stops and the error is thrown. 

To catch intermediate errors and continue or not you can provide a`onError()` callback.

```javascript
const PromisePoolRL = require('promise-pool-rate-limited');

async getAll() {
  let i = 0;

  await PromisePoolRL(next, 10, {onError: 20});
  
  function onError(err, promise, intermediateResult) {
    gotError++;
    if (promise.id !== 5) 
      throw new Error('Expected to receive the failing promise');
    if (err.message !== 'Failing on 6th Promise') 
      throw new Error(e);
    return true; // you can also return false to stop
  }

  function next() {
    if (i === 100000) return false; // done;
    i++;
    const p = async function () {
      // on the 6th promise throw an Error right away
      if (i === 5) {
        throw new Error('Failing on 6th Promise');
      } else { // wait 50ms
        const content =(await (await fetch(`https://api.co/${id}`).text());
      }
    };
    p.id = i; // here we keep the ID to identify the promise that failed.
    return p;
  }
}

getAll();
```

## Contributing 

Contributions are welcome 
- Someone to make a typeScript interface ? 

## License

BSD-3-Clause