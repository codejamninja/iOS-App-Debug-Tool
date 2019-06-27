const path = require('path');

module.exports = function(dep){
  dep = dep.replace(/\s*/g,'');
  if(dep.indexOf(':')<0){
    dep = dep.split('/').pop().replace(/-./g,(x)=>{
      return x[1].toUpperCase();
    }) + ':' + dep;
  }
  dep = dep.split(':');
  if(dep[1].indexOf('/') >= 0){
    dep[1] = path.join(process.cwd(),dep[1]);
  }
  return dep;
};