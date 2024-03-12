
/**
 * 
 * @param {Function} next when called returns a Promise or false when done;
 * @param {number} poolSize maximum size of the pool of running Promises
 * @param {Object} [options]
 * @param {number | null} [options.rateHz] maximum next() rate in Hz (call / second)
 * @param {Function} [options.onError] onError(error, promise) will be called when an error occurs. If not defined the process will stop.
 * @returns 
 */
function PromisePoolRL(next, poolSize, options) {

  return new Promise((resolve, reject) => {
    let rejected = false;
    function gotError(err) {
      if (! rejected) reject(err);
      rejected = true;
    }

    let count = 0;
    let done = false;
    function goNext() {
      if (done || rejected) { 
        if (count === 0 && ! rejected) resolve();
        return false;
      }
      const n = next();
      if (! n) { done = true; return false}
      count++;
      n().then(() => { count--; goNext()}, gotError);
      return true;
    }
    // call goNext up to the poolSize
    for (let i = 0; i <= poolSize; i++) {
      if (! goNext()) break; 
    }
  });
}

module.exports = PromisePoolRL;