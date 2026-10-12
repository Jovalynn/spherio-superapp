export interface MIReceiptPayload { protocol:string; keyId:string; status:string; decision:string; executionAllowed:boolean; authorizationId:string; policyVersion:string; intentDigest:string; chainId:string; account:string; issuedAt:string; expiresAt:string; observationHeight:string; observationBlockHash:string; provenanceDigest:string; }
export interface MIReceipt {payload:MIReceiptPayload;signature:string;}
export interface MIAuthority {keys:Array<{keyId:string;spki:string}>;maxTtlSeconds:number;consumeUrl:string;}
export interface WalletIntent {address?:string;network:{id?:string;chainId:string;rpcUrl?:string};[key:string]:unknown;}
export function canonicalJSON(value:unknown):string;
export function intentDigest(value:unknown):Promise<string>;
export function walletExecutionIntent(request:{id:string;action:string;origin?:string;networkId?:string;accountId?:string;address?:string;payload:unknown;expiresAt?:string},network:{id:string;chainId:string;rpcUrl:string}):WalletIntent;
export function verifyDecisionReceipt(receipt:unknown,intent:WalletIntent,authority:MIAuthority,now?:number,status?:string):Promise<MIReceiptPayload>;
export function consumeDecisionReceipt(receipt:unknown,intent:WalletIntent,authority:MIAuthority,fetcher?:typeof fetch):Promise<MIReceiptPayload>;
export function signDecisionReceipt(payload:MIReceiptPayload,key:CryptoKey):Promise<MIReceipt>;
