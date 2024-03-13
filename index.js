/**
 * 
 * @param {Function} next when called returns a Promise or false when done;
 * @param {number} maxConcurent maximum size of the pool of running Promises
 * @param {Object} [options]
 * @param {number | null} [options.rateHz] maximum next() rate in Hz (call / second)
 * @param {Function} [options.onError] onError(error, promise) will be called when an error occurs. If not defined the process will stop.
 * @returns 
 */
function PromisePoolRL(next, maxConcurent, options) {
  options = options || {};
  let currentWait = 0;
  if (options.rateHz) { // covers 0, null..  
    currentWait = 1000 / options.rateHz; 
  }
  const startTime = Date.now();
  let totalCount = 0;

  return new Promise((resolve, reject) => {

    // keep track of rejection to avoid multiple callback
    let rejected = false;
    function gotError(err, promise) {
      if (options.onError !== undefined) {
        const doNotFail = options.onError(err, promise);
        if (doNotFail) return true;
      } 
      if (! rejected) reject(err);
      rejected = true;
      return false;
    }

    let countConcurentCalls = 0;
    let done = false;

    function goNext(startWithDelay) {
      if (done || rejected) { 
        console.log({countConcurentCalls, rejected});
        if (countConcurentCalls === 0 && ! rejected) resolve();
        return false;
      }

      // get next Promise to execute and return if false
      const n = next();
      if (! n) { done = true; return false}

      countConcurentCalls++;
      async function nn () { // async function to be able to delay 

        // --- rate limiting ---//
        if (options.rateHz) {
          const delay = (startWithDelay != null) ? startWithDelay : currentWait;
          console.log({countConcurentCalls, delay, startWithDelay, currentWait});
          await new Promise((r) => { setTimeout(r, delay) });
        }
        totalCount++;
        // --- end rate limiting --//

        n().then(() => { 
          countConcurentCalls--; goNext()},  // resolve
          (e) => { // error
             if ( gotError(e, n) ) { // continue
                countConcurentCalls--; goNext()
             } 
          });
      };

      nn();

      return true;
    }

    // start by filling up the pool 
    for (let i = 0; i <= maxConcurent; i++) {
      if (! goNext(i * currentWait)) break; 
    }
  });
}

module.exports = PromisePoolRL;