//EEG32 worker to do more signal processing on the backend

// E.g. on front end:
// var worker = new Worker('./eeg32worker.js');
// worker.postMessage({foo:"xcor", input: [arr1,arr2]});
// worker.onmessage = (e) => {console.log(e.data)}

import {eeg32} from 'eeg32.js'
import {gpuUtils} from './utils/gpuJSUtils.js'

var i = 0;


function testcounter() {
  i = i + 1;
  postMessage(i);
  setTimeout("testcounter()",500);
}

//testcounter();


addEventListener('message',function(e){

    //Receive data like e.data = {foo: "cov1d", input: [arr1,arr2] or [mat1]}
    //postMessage("Received: " + e.data);
    var dat = e.data;
    var output = {};

    if(dat.foo === "xcor"){ output.dat = eeg32.crosscorrelation(e.data.input[0],e.data.input[1])}   //Takes 2 1D arrays
    if(dat.foo === "autocor"){ output.dat = eeg32.autocorrelation(e.data.input)}                    //Takes 1 1D array
    if(dat.foo === "cov1d"){ output.dat = eeg32.cov1d(e.data.input[0],e.data.input[1])}             //Takes 2 1D arrays
    if(dat.foo === "cov2d"){ output.dat = eeg32.cov2d(e.data.input) }                               //Takes 1 2D array with equal width rows
    if(dat.foo === "sma"){ output.dat = eeg32.sma(e.data.input[0],e.data.input[1])}                 //Takes 1 1D array and an sma window size
    if(dat.foo === "dft"){ var gpu = new gpuUtils(); output.dat = gpu.dft(input[0],input[1]) }      //Takes 1 1D array and the sample rate
    

    else {output.dat = "frodobaggins"}

    postMessage(output);
})