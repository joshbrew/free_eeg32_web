var full = document.location.protocol + location.pathname;
var localpath = full.substr(0,full.lastIndexOf("/") + 1);

importScripts(localpath+"gpu-browser.min.js",localpath+"gpuJSUtils.js");

const gpu = new gpuUtils();

onmessage = function(args) {
  // define gpu instance
    var output = 0;

    if(args.foo === "dft"){ //Takes 1 1D array and the sample rate 
        output = gpu.gpuDFT(args.input[0],args.input[1]); 
    }              
    else if(args.foo === "multidft") { //Takes 1 2D array with equal width rows, and the number of seconds of data being given
        output = gpu.MultiChannelDFT(args.input[0],args.input[1]);
    }  
    else if(args.foo === "multibandpassdft") { //Accepts 1 2D array of equal width, number of seconds of data, beginning frequency, ending frequency
        output = gpu.MultiChannelDFT_Bandpass(args.input[0],args.input[1],args.input[2],args.input[3]);} 
    else {return "function not defined"}

  // output some results!
  postMessage(output);
};

addEventListener('message', onmessage);