# Promise pool with rate limiting for Node.js

When you need to execute a very large number of Promise to be created "on the fly", but you must comply to maximum concurent and and/or maximum call rate.

This is mostly usefull when  

What you need at least: 

- a `next()` function that returns the next Promise to execute or `false` when done
- a `maxConcurent`value 

Options are 
- `rateHz` the maximum number of call to do per seconds
- `onError` to eventually catch error and the faulty promise

### Simple Exemple

Fetch items with id from 1 to 100000 from an API with a maximum concurent calls of 10;
```javascript
const PromisePoolRL = require('promise-pool-rate-limited');

async getAll() {
  let i = 0;

  await PromisePoolRL(next, 10);

  function next() {
    if (i === 100000) return false; // done;
    i++;
    return async function() {
      const content =(await (await fetch(`https://api.com/item/${id}`).text());
      // ... do something with the content
    }
  }
}

getAll();

```





## Contributing 

Contributions are welcome 

## License

BSD-3-Clause