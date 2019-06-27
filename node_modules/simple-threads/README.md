Easy to use threading of functions in Node.js

# simple-threads
Node.js module. Easy to use threading of functions in Node.js.

## Usage

**npm install simple-threads**

*Important to note:* The method **run** is available on all functions and methods (also **async** ones) when you are using **simple-threads**. It runs the function in a separate thread and returns a promise that will be resolved when the function has finished.

```javascript
someFunction.run([func arguments]);
```

### Basic example


```javascript
simpleThreads = require('simple-threads');

function createRandomNumArr(len){
  let randomNumberArray = [];
  // a loop that is time consuming
  while(randomNumberArray.length < len){
    randomNumberArray.push(Math.random());
  }
  return randomNumberArray;
}

// Run the function createRandomNumArr in a separate thread
createRandomNumArr.run(100000).then((x)=>{
    console.log('The array length is',x.length);
});
```

### Options

#### Max child processes
Simple-threads creates a number of child processes to run threads in. You can specify this number manually. (If you don't the number of processors detected on your machine will be used.)

```javascript
simpleThreads.maxChildren = 4;
```

Simple threads will assign functions/"threads" to different child processes using a round-robin strategy.

#### Loading modules
A problem when using threads is that the modules loaded in the parent context are not automatically loaded in the threads/child processes. Simple threads solves this by providing a require method:

The require method of **simple-threads** will let us require modules so that they are available in all threads as global variables.

Use the form variableName:moduleName for each module. Or: If you don't provide a variable the name will be derived using snake-to-camelcase conversion: big-integer -> bigInteger etc.

```javascript
simpleThreads.require(
  'Timer:precise-timer',
  'random-int',
  'big-integer',
  'fair-share',
  'myOwn:./my-own-module'
);
```

#### Getting statistics
To get some statistics about cpu usage etc from simple-threads just ask for stats:

```javascript
console.log(simpleThreads.stats);
```

##### Example of statistics
```json
 {
  "loadedModules": [
    [ "Timer", "precise-timer"],
    [ "randomInt", "random-int"],
    [ "bigInteger","big-integer"],
    [ "fairShare", "fair-share"]
  ],
  "childProcesses": [
    {
      "pid": 46124,
      "created": "2017-08-21T08:54:04.337Z",
      "cpuTime": 1150.73,
      "functionsRun": 7,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 7
    },
    {
      "pid": 46125,
      "created": "2017-08-21T08:54:04.339Z",
      "cpuTime": 1258.21,
      "functionsRun": 7,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 7
    },
    {
      "pid": 46126,
      "created": "2017-08-21T08:54:04.339Z",
      "cpuTime": 829.05,
      "functionsRun": 6,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 6
    },
    {
      "pid": 46127,
      "created": "2017-08-21T08:54:04.340Z",
      "cpuTime": 553.94,
      "functionsRun": 6,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 6
    },
    {
      "pid": 46128,
      "created": "2017-08-21T08:54:04.342Z",
      "cpuTime": 1001.54,
      "functionsRun": 6,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 6
    },
    {
      "pid": 46129,
      "created": "2017-08-21T08:54:04.343Z",
      "cpuTime": 904.62,
      "functionsRun": 6,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 6
    },
    {
      "pid": 46130,
      "created": "2017-08-21T08:54:04.344Z",
      "cpuTime": 848.61,
      "functionsRun": 6,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 6
    },
    {
      "pid": 46131,
      "created": "2017-08-21T08:54:04.345Z",
      "cpuTime": 575.13,
      "functionsRun": 6,
      "cachedFunctions": 1,
      "maxFunctionsRunInParallel": 6
    }
  ]
}
```

### Advanced example
Please Note: Here we use **simple-threads** in conjunction with the npm module **fair-share**, which is a module that lets several cpu-intense function share cpu time in one single thread by interrupting them.

The example shows that **simple-threads** - can run several functions/"threads" in parallel in one child-process if they don't hog the cpu but rather perform asynchronous tasks.

```javascript
// Load modules
const simpleThreads = require('./simple-threads/simple-threads');


// The require method of simpleThreads will let us require modules
// so that they are available in all threads as global variables.
//
// Use the form variableName:moduleName for each module.
// Or: If you don't provide a variable the name will be derived
// using snake-to-camelcase conversion: big-integer -> bigInteger etc.

simpleThreads.require(
  'Timer:precise-timer',
  'random-int',
  'big-integer',
  'fair-share'
);


// Max number of child processes - defaults to auto (which is the
// number of cpus detected by Node.js). You don't have to explicitly
// set auto - we just do it for clarity here.

simpleThreads.maxChildren = 'auto';


// Calculate Fibonacci numbers threaded and with interrupts

class Fibonacci {


  static async calc(n){
    // Run the method algo as a thread by using the run method
    // that simple-threads automatically adds to all functions
    return await this.algo.run(n);
  }

  // Calculate a fibonacci number
  static async algo(n){

    // We are using the npm module fair-share to run
    // several functions in parallel in one process/thread

    let req = n, share = new fairShare(),
        a = bigInteger(1), b = bigInteger(0);

    while (n--){
      let temp = a;
      a = a.plus(b);
      b = temp;
      await share.do(); // fairShare interrupt
    }

    return {
      request: req,
      stats: share.stats,
      result: b.toString()
    };

  }

}


// Calculate 50 Fibonacci numbers between 4000 and 40000

class Test {

  constructor(){
    Object.assign(this,{
      todo: 50,
      done: 0,
      timer: new Timer()
    });
    this.calc();
  }

  calc(){
    for(let i = 1; i <= this.todo; i++){
      Fibonacci.calc(randomInt(4000,40000)).then(
        (x)=>{this.result(i,x);}
      );
    }
  }

  result(i,x){
    console.log(
      'Test ' + i + '\n' +
      'time taken: ' + this.timer.elapsed +
      'ms' + '\n' + JSON.stringify(x,'',' ') + '\n\n'
    );
    this.done++;
    this.done == this.todo && this.report();
  }

  report(){
    console.log(
      'All ' + this.todo + ' done in ' + this.timer.elapsed + ' ms'
    );

    // Some statistics about cpu-usage etc from simpleThreads
    console.log('simpleThreads.stats:\n',simpleThreads.stats);
  }
}

new Test();
```
