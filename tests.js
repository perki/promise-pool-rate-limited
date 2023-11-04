const test = require('node:test');

const PromisePoolRL = require('./index');

test('Pool', async (t) => {

  await t.test('Pool of 10 with 1000 entries', async (t) => {
    let count = 0;
    function next() {
      const id = count++;
      if (id === 1000) return false;
      if (id > 1000) throw new Error('next() called too much');
      return (async function p() {
        // wait between 0 and 50ms
        await new Promise((r) => { setTimeout(r, Math.random() * 50)});
        console.log(id);
      });
    }
    await PromisePoolRL(next, 10);
  })

});