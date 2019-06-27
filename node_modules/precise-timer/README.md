# precise-timer
A precise timer for Node.js. Delivers its result in milliseconds with decimals. Default is 2 decimals, but you can use up to 6 decimals - to get down to nanosecond precision.

## Usage

**npm install precise-timer**

### Example

```javascript
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
```
