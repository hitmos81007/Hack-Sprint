"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { verificationMessages } from "../../lib/i18n";
import { useLanguage } from "./language";
import { buttonClass } from "./key-panel";
export function QrCode({value}:{value:string}){
 const canvas=useRef<HTMLCanvasElement>(null); const [failed,setFailed]=useState(false); const {locale}=useLanguage(); const t=verificationMessages[locale];
 useEffect(()=>{let mounted=true;import("qrcode").then(qr=>{if(mounted&&canvas.current)return qr.default.toCanvas(canvas.current,value,{width:384,margin:4,errorCorrectionLevel:"M"});}).then(()=>{if(mounted)setFailed(false);}).catch(()=>{if(mounted)setFailed(true);});return()=>{mounted=false;};},[value]);
 return <>{failed?<p role="alert">{t.error}</p>:<canvas ref={canvas} role="img" aria-label={t.qr} className="h-auto w-full max-w-sm bg-white"/>}</>;
}
export function QrScanner({onScan}:{onScan:(value:string)=>void}){
 const {locale}=useLanguage(); const t=verificationMessages[locale]; const video=useRef<HTMLVideoElement>(null);
 const stream=useRef<MediaStream|null>(null);const frame=useRef(0);const generation=useRef(0);
 const [active,setActive]=useState(false);const [failed,setFailed]=useState(false);
 const cleanup=useCallback(()=>{generation.current++;cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;},[]);
 useEffect(()=>()=>cleanup(),[cleanup]);
 async function start(){
  cleanup();const session=generation.current;setFailed(false);setActive(true);
  try{
   const decode=(await import("jsqr")).default;
   if(generation.current!==session)return;
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
   if(generation.current!==session){media.getTracks().forEach(track=>track.stop());return;}
   stream.current=media;if(!video.current)throw new Error("CAMERA_UNAVAILABLE");video.current.srcObject=media;await video.current.play();if(generation.current!==session)return;
   const canvas=document.createElement("canvas");const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)throw new Error("CAMERA_UNAVAILABLE");let last=0;
   const tick=(time:number)=>{
    if(generation.current!==session)return;
    const source=video.current;
    if(source&&source.readyState>=2&&time-last>150){last=time;canvas.width=Math.min(source.videoWidth,640);canvas.height=Math.round(source.videoHeight*canvas.width/source.videoWidth);
     if(canvas.width&&canvas.height){context.drawImage(source,0,0,canvas.width,canvas.height);const image=context.getImageData(0,0,canvas.width,canvas.height);const code=decode(image.data,image.width,image.height);
      if(code&&code.data.length<=4096){cleanup();setActive(false);onScan(code.data);return;}}
    }
    frame.current=requestAnimationFrame(tick);
   };frame.current=requestAnimationFrame(tick);
  }catch{if(generation.current===session){cleanup();setActive(false);setFailed(true);}}
 }
 return <div className="space-y-3"><video ref={video} muted playsInline hidden={!active} className="w-full max-w-sm rounded-lg"/>
 <button type="button" className={buttonClass} onClick={()=>{if(active){cleanup();setActive(false);}else void start();}}>{active?t.stop:t.scan}</button>{failed&&<p role="alert">{t.cameraError}</p>}</div>;
}
