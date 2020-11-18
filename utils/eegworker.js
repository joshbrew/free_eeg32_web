var full = document.location.protocol + location.pathname;
var localpath = full.substr(0,full.lastIndexOf("/"));
var parentpath = localpath.substr(0,localpath.lastIndexOf("/"));
importScripts(localpath+"/gpu-browser.min.js",localpath+"/gpuJSUtils.js", parentpath+"/eeg32.js");

const gpu = new gpuUtils();

onmessage = function(args) {
  // define gpu instance
    var output = 0;

    if(args.foo === "xcor"){ output = eeg32.crosscorrelation(args.input[0],args.input[1]);} //Takes 2 1D arrays
    else if(args.foo === "autocor"){ output = eeg32.autocorrelation(args.input);}      //Takes 1 1D array
    else if(args.foo === "cov1d"){ output = eeg32.cov1d(args.input[0],args.input[1]);} //Takes 2 1D arrays
    else if(args.foo === "cov2d"){ output = eeg32.cov2d(args.input); }              //Takes 1 2D array with equal width rows
    else if(args.foo === "sma"){ output = eeg32.sma(args.input[0],args.input[1]);}   //Takes 1 1D array and an sma window size
    else if(args.foo === "dft"){ //Takes 1 1D array and the sample rate 
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