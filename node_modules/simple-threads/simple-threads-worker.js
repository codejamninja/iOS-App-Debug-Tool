let funcMem = {},
    depsMemVersion = 0,
    depToName = require('./dep-to-name'),
    inParallel = 0;

function addDependencies(msg){
  if(msg.depsMemVersion == depsMemVersion){ return; }
  depsMemVersion = msg.depsMemVersion;
  for(let dep of msg.depsMem){
    let d = depToName(dep);
    global[d[0]] = require(d[1]);
  }
}

async function messageHandler(msg){
  addDependencies(msg);
  let toEval = 'f = async ' + msg.func, r;
  toEval = toEval.replace(/async/,'async function');
  toEval = toEval.replace(/function\s*async/,'function');
  toEval = toEval.replace(/function\s*function/,'function');
  funcMem[msg.funcId] = funcMem[msg.funcId] ||  eval(toEval);
  setImmediate(()=>{inParallel++;});
  try { r = await funcMem[msg.funcId].apply(this,msg.args); }
  catch(e){ console.log(e.stack); }
  setImmediate(()=>{inParallel--;});
  process.send({
    id: msg.id,
    result: r,
    inParallel: inParallel,
    cachedFunctions: Object.keys(funcMem).length
  });
}

process.on('message',messageHandler);