PreciseTimer = require('precise-timer');

// decimals is optional, defaults to 2
let timer = new PreciseTimer({decimals:6});
let randomNumberArray = [];

// a loop that is time consuming
while(randomNumberArray.length < 100000){
  randomNumberArray.push(Math.random());
}

// log how long time that has elapsed
console.log(timer.elapsed);