//Joshua Brewster, MIT license. Compute shader utilities. Programs need quite a bit of customizing

//Enable web gl 2.0 compute in chrome://flags or edge://flags and set the ANGLE backend to OpenGL. See https://github.com/9ballsyndrome/WebGL_Compute_shader for better docs
//Better example https://github.com/9ballsyndrome/WebGL_Compute_shader/blob/master/webgl-compute-bitonicSort/js/script.js
class computeJS {
    constructor(canvasId, res=[500,500], src){
        // Create WebGL2ComputeRenderingContext
        this.renderProgram = null;
        this.canvas = document.getElementById(canvasId);
        this.res = res;
        this.canvas.width = res[0];
        this.canvas.height = res[1];
        try {this.context = this.canvas.getContext('webgl2-compute', { antialias: false });}
        catch (err) {alert("WebGL 2 compute flags not enabled, enable and set the ANGLE backend to OpenGL, ", err); return false;}
    

        this.init(src);
    }

    async init(src){
        const computeShaderSource = src;
        const computeShader = this.context.createShader(this.context.COMPUTE_SHADER);
        this.context.shaderSource(computeShader,computeShaderSource);
        this.context.compileShader(computeShader);

        if (!this.context.getShaderParameter(computeShader, this.context.COMPILE_STATUS)) {
            console.error("Main compute shader build failed.");
            console.error(this.context.getShaderInfoLog(computeShader));
            this.context = null;
            return;
        }

        //=> Create the program.
        this.renderProgram = this.context.createProgram();
        this.context.attachShader(this.renderProgram, computeShader);
        this.context.linkProgram(this.renderProgram);

        if (!this.context.getProgramParameter(this.renderProgram, this.context.LINK_STATUS)) {
            console.error("Main compute shader program initialization failed.");
            console.error(this.context.getProgramInfoLog(this.renderProgram));
            this.context = null;
            return;
        }

        return this.renderProgram;
    }

    render = () => {
        this.context.useProgram(this.renderProgram);
        
        /* 
            //=> Bind the buffers to the rendering shader.
            this.bindBuffer(this.context, this.renderProgram, this.vertices_buffer_id, "Vertices");
            this.bindBuffer(this.context, this.renderProgram, this.triangles_buffer_id, "Triangles");
            this.bindBuffer(this.context, this.renderProgram, this.meshes_buffer_id, "Meshes");

            //=> Fill the rendering shader uniforms.
            this.context.uniform1f(this.uniform_locations.rng, this.RENDER_SEED);
            this.context.uniform1i(this.uniform_locations.spp, this.SPP);
            this.context.uniformMatrix4fv(this.uniform_locations.camera_inverse_projection, false, inverse_camera_perspective.elements);
            this.context.uniformMatrix4fv(this.uniform_locations.camera_to_world, false, camera_world_matrix.elements);

        */

        this.context.dispatchCompute(this.res[0] / 16, this.res[1] / 16, 1);

        this.context.memoryBarrier(this.context.TEXTURE_FETCH_BARRIER_BIT);
        
        var result;
        this.context.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, result);


    }

}


/* 

//bitonic sort example, full code at https://github.com/9ballsyndrome/WebGL_Compute_shader/blob/master/webgl-compute-bitonicSort/js/script.js
const MAX_THREAD_NUM = 1024;
const MAX_GROUP_NUM = 2048;

const computeGPU = async (arr) => {
  const now = performance.now();

  const length = arr.length;

  const threadgroupsPerGrid = Math.max(1, length / MAX_THREAD_NUM);

  // create ShaderStorageBuffer
  const ssbo = context.createBuffer();
  context.bindBuffer(context.SHADER_STORAGE_BUFFER, ssbo);
  context.bufferData(context.SHADER_STORAGE_BUFFER, arr, context.DYNAMIC_COPY);
  context.bindBufferBase(context.SHADER_STORAGE_BUFFER, 0, ssbo);

  // execute ComputeShader
  context.useProgram(bitonicSortProgram1);
  context.dispatchCompute(threadgroupsPerGrid, 1, 1);
  context.memoryBarrier(context.SHADER_STORAGE_BARRIER_BIT);

  if (threadgroupsPerGrid > 1) {
    for (let k = threadgroupsPerGrid; k <= length; k <<= 1) {
      for (let j = k >> 1; j > 0; j >>= 1) {
        // execute ComputeShader
        context.useProgram(bitonicSortProgram2);
        context.uniform4uiv(bitonicSortProgram2UniformLocation, new Uint32Array([k, j, 0, 0]));
        context.dispatchCompute(threadgroupsPerGrid, 1, 1);
        context.memoryBarrier(context.SHADER_STORAGE_BARRIER_BIT);
      }
    }
  }

  // get result
  const result = new Float32Array(length);
  context.getBufferSubData(context.SHADER_STORAGE_BUFFER, 0, result);
  log(`GPU sort time: ${Math.round(performance.now() - now)} ms`);
  console.log(`GPU sort result validation: ${validateSorted(result) ? 'success' : 'failure'}`);
};

const computeShaderSource1 = `#version 310 es
    layout (local_size_x = ${MAX_THREAD_NUM}, local_size_y = 1, local_size_z = 1) in;
    layout (std430, binding = 0) buffer SSBO {
      float data[];
    } ssbo;
    shared float sharedData[${MAX_THREAD_NUM}];
    
    void main() {
      sharedData[gl_LocalInvocationID.x] = ssbo.data[gl_GlobalInvocationID.x];
      memoryBarrierShared();
      barrier();
      
      uint offset = gl_WorkGroupID.x * gl_WorkGroupSize.x;
      
      float tmp;
      for (uint k = 2u; k <= gl_WorkGroupSize.x; k <<= 1) {
        for (uint j = k >> 1; j > 0u; j >>= 1) {
          uint ixj = (gl_GlobalInvocationID.x ^ j) - offset;
          if (ixj > gl_LocalInvocationID.x) {
            if ((gl_GlobalInvocationID.x & k) == 0u) {
              if (sharedData[gl_LocalInvocationID.x] > sharedData[ixj]) {
                tmp = sharedData[gl_LocalInvocationID.x];
                sharedData[gl_LocalInvocationID.x] = sharedData[ixj];
                sharedData[ixj] = tmp;
              }
            }
            else
            {
              if (sharedData[gl_LocalInvocationID.x] < sharedData[ixj]) {
                tmp = sharedData[gl_LocalInvocationID.x];
                sharedData[gl_LocalInvocationID.x] = sharedData[ixj];
                sharedData[ixj] = tmp;
              }
            }
          }
          memoryBarrierShared();
          barrier();
        }
      }
      ssbo.data[gl_GlobalInvocationID.x] = sharedData[gl_LocalInvocationID.x];
    }
    `;

*/