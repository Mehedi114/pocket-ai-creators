export const presets={'35x45':[413,531,35,45],'2x2':[600,600,50.8,50.8],stamp:[295,354,25,30]};
export function dimensions(width,height){if(!Number.isInteger(width)||!Number.isInteger(height)||width<50||height<50||width>2400||height>2400)throw new Error('Width ও height 50–2400 পূর্ণসংখ্যা হতে হবে।');return [width,height];}
export function cropRect(sw,sh,w,h,zoom,x,y){const scale=Math.max(w/sw,h/sh)*zoom,cw=w/scale,ch=h/scale;return [(sw-cw)*(x+1)/2,(sh-ch)*(y+1)/2,cw,ch];}
// Only flood through matching pixels connected to the image boundary.
export function removeBackdrop(image,colour,tolerance){const {data,width:w,height:h}=image,n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;const threshold=tolerance*tolerance;
 const visit=i=>{if(seen[i])return;seen[i]=1;const j=i*4;if((data[j]-colour[0])**2+(data[j+1]-colour[1])**2+(data[j+2]-colour[2])**2>threshold)return;queue[tail++]=i;};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const i=queue[head++],x=i%w;data[i*4+3]=0;if(x>0)visit(i-1);if(x<w-1)visit(i+1);if(i>=w)visit(i-w);if(i<n-w)visit(i+w);}return image;}
export function sheetLayout(pageW,pageH,photoW,photoH,count){if(!Number.isInteger(count)||count<1||count>60)throw new Error('Copies 1–60 পূর্ণসংখ্যা হতে হবে।');const margin=5,gap=3,cols=Math.floor((pageW-2*margin+gap)/(photoW+gap)),rows=Math.floor((pageH-2*margin+gap)/(photoH+gap));if(cols<1||rows<1||count>cols*rows)throw new Error(`এই sheet-এ সর্বোচ্চ ${Math.max(0,cols*rows)}টি ছবি ধরে। Copies বা photo size কমাও।`);return Array.from({length:count},(_,i)=>({x:margin+(i%cols)*(photoW+gap),y:margin+Math.floor(i/cols)*(photoH+gap)}));}
