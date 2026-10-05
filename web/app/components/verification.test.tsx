import {describe,it,expect,vi} from "vitest";
import {Wallet} from "ethers";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {renderToStaticMarkup} from "react-dom/server";
import {createVerificationToken,decodeVerificationToken,verifyOfficerProof} from "../../lib/verification-schema";
import {IntentPanel} from "./intent-panel";
import {CitizenVerify} from "./citizen-verify";
import {OfficerSigning} from "./officer-signing";
import type {Officer} from "../../lib/onboarding-schema";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
describe("verification UI and QR transport",()=>{
 it("renders anonymous verification with institution/category input and the authorization warning",()=>{
  const markup=renderToStaticMarkup(<CitizenVerify/>);expect(markup).toContain("Who does the caller claim to represent");expect(markup).toContain('name="category"');for(const name of ["purpose","amount","payee"])expect(markup).toContain('name="'+name+'"');expect(markup).toContain("Identity is not authorization");expect(markup).toContain("Create challenge");
 });
 it("renders official-action creation and institutional attestation",()=>{const id="10000000-0000-4000-8000-000000000777";expect(renderToStaticMarkup(<IntentPanel mode="officer" institutionId={id}/>)).toContain("Create Official Action");expect(renderToStaticMarkup(<IntentPanel mode="issuer" institutionId={id}/>)).toContain("not an individual or personal account");});
 it("renders officer challenge id/code input with explicit review and a locked key",()=>{
  const officer={id:"synthetic",user_id:"synthetic",institution_id:"synthetic",name:"Synthetic Officer",role_title:"Demo",wallet_address:Wallet.createRandom().address,status:"active",expires_at:"2030-01-01T00:00:00.000Z",credential:null} satisfies Officer;
  const markup=renderToStaticMarkup(<OfficerSigning wallet={null} officer={officer}/>);expect(markup).toContain('name="id"');expect(markup).toContain('pattern="[0-9]{6}"');expect(markup).toContain("Unlock the key");expect(markup).not.toContain("privateKey");
 });
 it("round-trips a signed response through the actual QR encoder and camera decoder",async()=>{
  const wallet=Wallet.createRandom();const challenge={id:"00000000-0000-4000-8000-000000000777",code:"000123",claimedEntity:"Synthetic Bank",claimedCategory:"bank" as const,purpose:"information" as const,amount:"0.00",payee:"",expiresAt:new Date(Date.now()+120000).toISOString()};
  const token=await createVerificationToken(wallet,challenge,"40000000-0000-4000-8000-000000000777");const qr=QRCode.create(token,{errorCorrectionLevel:"M"});const scale=5,border=4;const width=(qr.modules.size+border*2)*scale;const pixels=new Uint8ClampedArray(width*width*4).fill(255);
  for(let row=0;row<qr.modules.size;row++)for(let col=0;col<qr.modules.size;col++)if(qr.modules.get(row,col))for(let y=0;y<scale;y++)for(let x=0;x<scale;x++){
   const offset=(((row+border)*scale+y)*width+(col+border)*scale+x)*4;pixels[offset]=0;pixels[offset+1]=0;pixels[offset+2]=0;
  }
  const scanned=jsQR(pixels,width,width);expect(scanned?.data).toBe(token);expect(verifyOfficerProof(decodeVerificationToken(scanned!.data),challenge)).toBe(true);expect(verifyOfficerProof(decodeVerificationToken(token),{...challenge,code:"000124"})).toBe(false);
 });
});
