

function PromisePoolRL(next, poolSize) {
  return new Promise((resolve, reject) => {
    let rejected = false;
    function gotError(err) {
      if (! rejected) reject(err);
      rejected = true;
    }

    let count = 0;
    let done = false;
    function goNext() {
      if (done) { 
        if (count === 0) resolve();
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