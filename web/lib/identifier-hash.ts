import "server-only";
import {keccak256,toUtf8Bytes} from "ethers";
import {normalizeIdentifier,type IdentifierType} from "./normalize";
import {ApiError} from "./api";
export function registryPepper(){const pepper=process.env.REGISTRY_PEPPER;if(!pepper||pepper.length<16)throw new ApiError(503,"REGISTRY_CONFIG");return pepper;}
export function idHash(value:string,type?:IdentifierType){let identifier;try{identifier=normalizeIdentifier(value,type);}catch{throw new ApiError(400,"INVALID_IDENTIFIER");}return keccak256(toUtf8Bytes(identifier.normalized+registryPepper()));}
export function reportKey(reportId:string){return keccak256(toUtf8Bytes("SatyaCall|report|"+reportId+"|"+registryPepper()));}
