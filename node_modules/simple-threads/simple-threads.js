const depToName = require('./dep-to-name');
      childProcess = require('child_process'),
      os = require('os'),
      asleep = require('asleep'),
      Timer = require('precise-timer');

let funcId = 1,
    runId = 1,
    inProcess = {},
    depsMem = [],
    depsMemVersion = 0,
    workers = [],
    childrenDefault = os.cpus().length,
    children = childrenDefault;


function createWorkers(){
  if(process.send){return;}
  while(workers.length < children){
    let w = childProcess.fork(__dirname + '/simple-threads-worker');
    w.on('message',(msg)=>{ messageHandler(msg,w); });
    Object.assign(w,{
      created: new Date(),
      functionsRun: 0,
      functionsRunning: 0,
      cpuTime: 0,
      maxFunctionsRunInParallel: 0,
      cachedFunctions:0
    });
    workers.push(w);
  }
  if(Object.keys(inProcess) > 0 && workers.length > children){
    setTimeout(createWorkers,10);
  }
  while(workers.length > children){
    workers.pop();
  }
}

function messageHandler(msg,w){
  w.functionsRun++;
  w.functionsRunning--;
  w.maxFunctionsRunInParallel = Math.max(
    w.maxFunctionsRunInParallel,
    msg.inParallel
  );
  w.cachedFunctions = msg.cachedFunctions;
  if(!w.functionsRunning){
    w.cpuTime += w.startBusy.elapsed;
    w.startBusy = false;
  }
  let resolve = inProcess[msg.id];
  if(!resolve){return;}
  delete inProcess[msg.id];
  resolve(msg.result);
}

function addDependencies(msg){
  for(let dep of depsMem){
    let d = depToName(dep);
    global[d[0]] = require(d[1]);
  }
}

function run(...args){
  if(process.send){throw(new Error(
    "You can only run a simple-thread from the main process."
  ))}
  this.funcId = this.funcId || funcId++;
  let msg = {
    id: runId++,
    funcId: funcId,
    func:this + '',
    args:args,
    depsMem: depsMem,
    depsMemVersion: depsMemVersion
  };
  let w = workers[0];
  w.startBusy = w.startBusy || new Timer();
  w.functionsRunning++;
  w.maxFunctionsRunInParallel = Math.max(
    1,w.maxFunctionsRunInParallel
  );
  w.send(msg);
  workers.push(workers.shift());
  let p = new Promise((resolve,reject)=>{
    inProcess[msg.id] = resolve;
  });
  return p;
};

createWorkers();
Function.prototype.run = run;

module.exports =  class SimpleThreads {

  static require(...args){
    depsMemVersion++;
    depsMem.push.apply(depsMem,args);
    addDependencies();
  }

  static get maxChildren(){
    return workers.length;
  }

  static set maxChildren(x){
    if(isNaN(x/1) || x < 1){
      children = childrenDefault;
    }
    children = x;
    createWorkers();
  }

  static get stats(){
    return {
      loadedModules: depsMem.map(depToName),
      childProcesses: workers.map((x)=>{
        let y = {}, props = [
          'pid',
          'created',
          'cpuTime',
          'functionsRun',
          'cachedFunctions',
          'maxFunctionsRunInParallel'
        ];
        for(let i of props){
          y[i] = x[i];
        }
        return y;
      }).sort((a,b)=>{
        return a.pid > b.pid ? 1: -1;
      })
    };
  }

}