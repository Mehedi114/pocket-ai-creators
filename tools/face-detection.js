import {nets,detectAllFaces,TinyFaceDetectorOptions} from 'face-api.js';
let loading;
export async function detectFaces(canvas){
 if(!loading)loading=nets.tinyFaceDetector.loadFromUri('/assets/models').catch(error=>{loading=null;throw error;});
 await loading;
 const detections=await detectAllFaces(canvas,new TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.45}));
 return detections.map(({box,score})=>({x:(box.x+box.width/2)/canvas.width,y:(box.y+box.height/2)/canvas.height,width:box.width/canvas.width,height:box.height/canvas.height,score})).sort((a,b)=>b.width*b.height-a.width*a.height);
}
