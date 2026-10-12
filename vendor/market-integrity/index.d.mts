export interface MIDecision { protocol: string; decision: "PASS" | "WARN-ADJUST" | "BLOCK"; executionAllowed: boolean; maxTxBaseUnits: string | null; reasonCodes: string[]; policyVersion?: string | null; constraints: Record<string,string>; omittedTerms: Array<{term:string;reason:string}>; }
export function unavailableDecision(reason?:string,extra?:Record<string,unknown>):MIDecision;
export function evaluateMarketIntegrity(policy:unknown,state:unknown,intent:unknown,now?:number):MIDecision;
export function amount(value:unknown):bigint;
export const MI_PROTOCOL:string;
