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