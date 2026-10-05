import {z} from "zod";
export const tacticNames=["DIGITAL_ARREST","SAFE_ACCOUNT","SECRECY_PAYMENT","CREDENTIAL_REQUEST","THREAT","URGENCY","PAYMENT","AUTHORITY","PRIZE_FEE","OTHER_WARNING","ISOLATION","SUSPICIOUS_LINK"] as const;
export type Tactic=typeof tacticNames[number];
export const highlightSchema=z.object({start:z.number().int().nonnegative(),end:z.number().int().positive(),tactic:z.enum(tacticNames)}).strict();
export const resultSchema=z.object({score:z.number().int().min(0).max(100),risk:z.enum(["LOW","MEDIUM","HIGH"]),hardFlag:z.boolean(),tactics:z.array(z.enum(tacticNames)),provider:z.enum(["heuristics","hybrid","heuristics-fallback"]),latencyMs:z.number().int().min(0),highlights:z.array(highlightSchema).max(40).optional()}).strict();
export type AnalysisResult=z.infer<typeof resultSchema>;
export function normalizeText(text:string){return text.normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();}
export function riskForScore(score:number):AnalysisResult["risk"]{return score>=70?"HIGH":score>=20?"MEDIUM":"LOW";}
// Each tactic contributes once, regardless of repetition. Scores are indicators, not probabilities.
const rules:ReadonlyArray<{name:Tactic;weight:number;hard?:boolean;pattern:RegExp}>=[
 {name:"DIGITAL_ARREST",weight:95,hard:true,pattern:/digital\s*(?:arrest|custody)|डिजिटल\s*(?:अरेस्ट|गिरफ्तारी)|டிஜிட்டல்\s*கைது|dijital\s*(?:arrest|kaidhu)/giu},
 {name:"SAFE_ACCOUNT",weight:95,hard:true,pattern:/safe\s*(?:bank\s*)?account|secure\s*(?:verification\s*)?account|सुरक्षित\s*खात[ाे]|surakshit\s*(?:khata|account)|பாதுகாப்பு\s*கணக்கு|paadhukaappu\s*kanakku/giu},
 {name:"CREDENTIAL_REQUEST",weight:80,hard:true,pattern:/(?:share|tell|send|give|reveal|बताओ|भेजो|बताएं|bhejo|batao|kodu|sollu|அனுப்பு|கொடு).{0,35}(?:otp|password|pin|ओटीपी|पासवर्ड|பாஸ்வேர்டு)|(?:otp|ओटीपी|password|pin|கடவுச்சொல்).{0,25}(?:बताओ|भेजो|batao|bhejo|sollu|kodu|சொல்லு|கொடு)/giu},
 {name:"THREAT",weight:35,pattern:/\barrest\b|\bjail\b|police\s*case|legal\s*action|गिरफ्तार|गिरफ्तारी|जेल|kaidhu|giraf[td]ar|கைது|சிறை/giu},
 {name:"URGENCY",weight:20,pattern:/immediately|urgent(?:ly)?|right\s*now|within\s*\d+\s*(?:minute|hour)|तुरंत|अभी|जल्दी|turant|abhi|jaldi|udane|உடனே|உடனடி/giu},
 {name:"PAYMENT",weight:15,pattern:/\btransfer\b|\bpay(?:ment)?\b|\bupi\b|\bdeposit\b|send\s*money|पैस[ाे]|भुगतान|भेजो|paise|paisa|bhejo|panam|பணம்|செலுத்து/giu},
 {name:"AUTHORITY",weight:10,pattern:/\b(?:cbi|rbi|police|customs|court|narcotics|income\s*tax)\b|पुलिस|सीबीआई|आरबीआई|अदालत|kaaval|காவல்|காவல்துறை|சுங்க/giu},
 {name:"ISOLATION",weight:25,pattern:/don[’']?t\s*tell|do\s*not\s*tell|keep\s*(?:this\s*)?(?:secret|confidential)|stay\s*on\s*(?:the\s*)?call|किसी\s*को\s*मत|मत\s*बताना|kisi\s*ko\s*mat|mat\s*batana|yaarukkum\s*soll(?:a|u)?(?:dhe|athe)?|யாருக்கும்\s*சொல்லா|அழைப்பில்\s*இரு/giu},
 {name:"PRIZE_FEE",weight:80,hard:true,pattern:/(?:prize|lottery|reward|लॉटरी|इनाम|பரிசு|பரிசு தொகை).{0,70}(?:fee|pay|tax|शुल्क|पैसे|panam|கட்டணம்|செலுத்து)/giu},
 {name:"SUSPICIOUS_LINK",weight:35,pattern:/http:\/\/[^\s<>]+|https?:\/\/(?:[^\s/]*@|(?:bit\.ly|tinyurl\.com|t\.co)\/)[^\s<>]*|https?:\/\/[^\s/]*(?:kyc|verify|prize|refund|bank-update)[^\s/]*\.(?:invalid|xyz|top|click)(?:\/[^\s<>]*)?/giu}
];
function preventive(text:string,start:number,end:number){
 const prefix=text.slice(Math.max(0,start-65),start).split(/[.!?\n।]/).pop()??"";
 const clause=text.slice(start,Math.min(text.length,end+45)).split(/[.!?\n।]/)[0];
 // Scope negation to the matched clause. A warning elsewhere cannot neutralize a demand.
 return /(?:never|do\s+not|don[’']?t|beware\s+of|avoid|report|not\s+under|no\s+such\s+thing\s+as|कभी.{0,20}न|मत|सावधान|இல்லை|வேண்டாம்|pagiradhe|share\s+mat)\s*(?:(?:your|the|this|any|a|an|bank|ever|digital|to|under|with|transfer|send|money|funds|pay|share)\s+){0,4}$/iu.test(prefix)
  || /(?:नहीं\s*(?:है|होता)|(?:^|\s)न\s*करें|मत\s*(?:करें|देना|बताओ)|செய்யாதீர்கள்|பகிராதீர்கள்|அனுப்பாதீர்கள்|வேண்டாம்|போலி|is\s+(?:a\s+)?scam|does\s+not\s+exist|are\s+scams)/iu.test(clause);
}
export function runHeuristics(text:string):AnalysisResult{
 const start=performance.now();const found=new Set<Tactic>();const highlights:NonNullable<AnalysisResult["highlights"]>=[];let score=0,hardFlag=false;
 for(const rule of rules){let hit=false;for(const match of text.matchAll(new RegExp(rule.pattern.source,rule.pattern.flags))){const offset=match.index;if(preventive(text,offset,offset+match[0].length))continue;hit=true;if(highlights.length<40)highlights.push({start:offset,end:offset+match[0].length,tactic:rule.name});}if(hit){found.add(rule.name);score+=rule.weight;hardFlag ||= !!rule.hard;}}
 if(found.has("ISOLATION")&&found.has("PAYMENT")){found.add("SECRECY_PAYMENT");score+=95;hardFlag=true;}
 score=Math.min(100,Math.max(hardFlag?90:0,score));
 return {score,risk:riskForScore(score),hardFlag,tactics:[...found],highlights:highlights.sort((a,b)=>a.start-b.start||b.end-a.end),provider:"heuristics",latencyMs:Math.max(0,Math.round(performance.now()-start))};
}
export function needsLanguageHelp(text:string){return /[^\u0000-\u007f]/.test(text)||/\b(paisa|paise|karo|bhejo|batao|mat|panam|udane|kaidhu|sollu|kaaval|surakshit|jaldi|turant|abhi)\b/i.test(text);}
