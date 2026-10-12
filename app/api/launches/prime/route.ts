import {NextResponse} from "next/server";
export async function GET(){return NextResponse.json({ok:false,available:false,authoritative:false,product:"Prime",intelligenceProduct:"Nexus",state:null,reason:"CANONICAL_PRIME_LAUNCH_PROVIDER_UNAVAILABLE"},{status:503});}
