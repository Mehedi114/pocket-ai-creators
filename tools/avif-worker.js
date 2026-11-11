import createEncoder from '@jsquash/avif/codec/enc/avif_enc.js';
import {defaultOptions} from '@jsquash/avif/meta.js';
let encoder;
self.onmessage=async ({data})=>{try{encoder ||= createEncoder({locateFile:()=>'/assets/codecs/avif_enc.wasm'});const module=await encoder;const output=module.encode(new Uint8Array(data.pixels),data.width,data.height,{...defaultOptions,quality:data.quality,speed:8});if(!output)throw new Error('AVIF encoding failed.');const copy=output.slice();self.postMessage({buffer:copy.buffer},[copy.buffer]);}catch(error){self.postMessage({error:error.message||'AVIF conversion failed.'})}};
