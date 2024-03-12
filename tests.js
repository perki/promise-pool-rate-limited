const test = require('node:test');

const PromisePoolRL = require('./index');

test('Pool', async (t) => {

  const tests = [
    {
      poolSize: 10,
      entries: 1000
    },
    {
      poolSize: 10,
      entries: 1
    },
    {
      poolSize: 1,
      entries: 10
    },
  ];

  for (const test of tests) {
    await t.test('Pool of 1 with 10 entries', async (t) => {
      let count = -1;
      let startedEntries = 0;
      let doneEntries = 0;
      const poolSize = test.poolSize;
      const entries = test.entries;
      function next() {
        const id = ++count;
        if (id === entries) return false;
        if (id > entries) throw new Error('next() called too much');
        return (async function p() {
          startedEntries++;
          // wait between 0 and 50ms
          await new Promise((r) => { setTimeout(r, Math.random() * 50) });
          doneEntries++;
        });
      }
      await PromisePoolRL(next, poolSize);
      console.log({ startedEntries, doneEntries, totalEntries: entries });
      if (startedEntries != entries) throw new Error(`Expected startedEntries: ${startedEntries} to be equal to expectedEntries: ${entries}`)
      if (doneEntries != entries) throw new Error(`Expected doneEntries: ${doneEntries} to be equal to expectedEntries: ${entries}`)
    });
  }
});