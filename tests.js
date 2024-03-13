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
      if (startedEntries != entries) throw new Error(`Expected startedEntries: ${startedEntries} to be equal to expectedEntries: ${entries}`)
      if (doneEntries != entries) throw new Error(`Expected doneEntries: ${doneEntries} to be equal to expectedEntries: ${entries}`)
    });
  }
});

test('Reject', async (t) => {
  let count = -1;
  let startedEntries = 0;
  let doneEntries = 0;
  const poolSize = 3;
  const entries = 10;

  function next() {
    const id = ++count;
    if (id === entries) return false;
    if (id > entries) throw new Error('next() called too much');
    return (async function p() {
      startedEntries++;
      // on the 5th promise throw an Error right away
      if (id === 5) {
        throw new Error('Failing on 6th Promise');
      } else { // wait 50ms
        await new Promise((r) => { setTimeout(r, 50) });
        doneEntries++;
      }
    });
  }
  try {
    await PromisePoolRL(next, poolSize);
  } catch (e) {
    if (e.message !== 'Failing on 6th Promise') throw new Error(e);
  }
  // doneEntries must be < 6
  if (doneEntries > 5) throw new Error('Too many next() called');
  // startedEntries must be === 6 (6th and 7th migth have been started)
  if (startedEntries !== 6) throw new Error('next() must have been called 6 times'); 
});

test('Reject catching Error and continuing', async (t) => {
  let count = -1;
  let startedEntries = 0;
  let doneEntries = 0;
  const poolSize = 3;
  const entries = 10;

  let gotError = 0;
  function onError(err, promise) {
    gotError++;
    if (promise.id !== 5) throw new Error('Expected to receive the failing promise');
    if (err.message !== 'Failing on 6th Promise') throw new Error(e);
    return true;
  }

  function next() {
    const id = ++count;
    if (id === entries) return false;
    if (id > entries) throw new Error('next() called too much');
    const p = async function () {
      startedEntries++;
      // on the 5th promise throw an Error right away
      if (id === 5) {
        doneEntries++;
        throw new Error('Failing on 6th Promise');
      } else { // wait 50ms
        await new Promise((r) => { setTimeout(r, 50) });
        doneEntries++;
      }
    };
    p.id = id;
    return p;
  }

  await PromisePoolRL(next, poolSize, { onError });
  if (gotError != 1) throw new Error(`Expected gotError: ${gotError} to be equal 1`)
  if (startedEntries != entries) throw new Error(`Expected startedEntries: ${startedEntries} to be equal to expectedEntries: ${entries}`)
  if (doneEntries != entries) throw new Error(`Expected doneEntries: ${doneEntries} to be equal to expectedEntries: ${entries}`)
});

test('Rate limiting', async (t) => {
  let count = -1;
  const poolSize = 5;
  const entries = 50;

  const desiredRateHz = 50; // 10 per seconds

  const startTime = Date.now();

  function next() {
    const id = ++count;
    if (id === entries) return false;
    if (id > entries) throw new Error('next() called too much');
    return (async function p() {
      await new Promise((r) => { setTimeout(r, 50) });
    });
  }
  const result = await PromisePoolRL(next, poolSize, {rateHz: desiredRateHz}); 
  const endTime = Date.now();
  const calculatedRate = count * 1000 / (endTime - startTime);
  if (calculatedRate * 0.99 > result.averageRateHz || calculatedRate * 1.01 < result.averageRateHz) 
    throw new Error(`result.averageRateHz ${result.averageRateHz} should be approx 1% of calculatedRate ${calculatedRate}`);
  if (desiredRateHz * 0.9 > result.averageRateHz || desiredRateHz * 1.1 < result.averageRateHz) 
    throw new Error(`result.averageRateHz ${result.averageRateHz} should be approx 10% of desiredRateHz ${desiredRateHz}`);
});
