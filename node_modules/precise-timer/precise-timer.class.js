module.exports = class PreciseTimer {

  constructor(settings){

    // Defaults (override with settings)
    const defaults = {
      decimals: 2
    };

    Object.assign(this,defaults,settings,{
      // Dependencies
      process: require('process'),
    });

    this.start = this.process.hrtime();

  }

  get elapsed(){
    // Return elapsed time in ms
    // since the instance was created
    let t = this.process.hrtime(this.start);
    let elapsed = t[0] * 1000 + t[1] / 1000000;
    let divide = Math.pow(10,this.decimals);
    return Math.round(elapsed * divide) / divide;
  }

}