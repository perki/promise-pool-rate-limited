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
  let expectedDuration = 0;
  if (options.rateHz) { // covers 0, null..
    // standard wait depend on the number of concurent call  
    expectedDuration = 1000 * maxConcurent / options.rateHz ; 
  }
  const startTime = Date.now();
  let startedCount = 0;
  let failCount = 0;

  return new Promise((resolve, reject) => {
    const durations = [];
    const durationsMemorySize = maxConcurent;

    // keep track of rejection to avoid multiple callback
    let rejected = false;
    function gotError(err, promise) {
      failCount++;
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

    function goNext() {
      
      if (done || rejected) { 
        if (countConcurentCalls === 0 && ! rejected) {
          const executionTimeMs = Date.now() - startTime;
          const averageRateHz = 1000 * ( startedCount + failCount ) / executionTimeMs;
          resolve({executionTimeMs, startedCount, failCount, averageRateHz});
        }
        return false;
      }

      // get next Promise to execute or goNext() if done to enventually resolve
      const n = next();
      if (! n) { done = true; return goNext(); }

      countConcurentCalls++;
      async function nn () { // async function to be able to delay 
        startedCount++;

        
        // --- rate limiting ---//
        const delay = getCurrentDuration();
        if (delay > 0) await new Promise((r) => { setTimeout(r, delay) });
        // --- end rate limiting --//

        const callStartTime = Date.now();
        n().then(() => { // resolve
          addMyDuration(Date.now() - callStartTime);
          countConcurentCalls--; goNext()
        },  
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
    for (let i = 0; i < maxConcurent; i++) {
      if (! goNext(i * expectedDuration)) break; 
    }

     // --- delay calculation ---- //

     /**
     * Calculate the average duration of "n" last calls and returns expected wait time
     * @returns {number} - the delay to apply 
     */
     function getCurrentDuration() {
      if (! options.rateHz) return 0;
      if (durations.length < durationsMemorySize) return expectedDuration;
      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      return Math.max(0, expectedDuration - averageDuration);
    }

    /**
     * records "n" last duration 
     * @param {number} duration 
     * @returns 
     */
    function addMyDuration(duration) {
      if (! options.rateHz) return;
      if (durations.length > durationsMemorySize) durations.shift();
      durations.push(duration);
    }
  });
}

module.exports = PromisePoolRL;