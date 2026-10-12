import {NextResponse} from "next/server";
import {getPrimeLaunchSurfaceState} from "@/lib/launch/authority";
/** Preserve the existing configuration journey. This endpoint does not attest
 * deployment, current monetary value, liquidity or live intelligence readiness.
 */
export async function GET(){
 const recovered=getPrimeLaunchSurfaceState();
 return NextResponse.json({ok:true,configurationAvailable:true,available:false,authoritative:false,executionAllowed:false,executionPlan:null,product:"Prime",intelligenceProduct:"Nexus",source:"prime_configuration_from_recovered_spec",
  reason:"CANONICAL_PRIME_MARKET_AND_MONETARY_PROVIDER_UNAVAILABLE",
  state:{...recovered,lifecycle:{...recovered.lifecycle,progressPercent:0,meaning:"configuration_journey_without_deployment_evidence"},authority:{issuerGrade:false,monetary:false,settlement:false,marketHandoffTarget:"lp_then_screener_then_trade_then_rioex"},
   primeEconomics:{creationFeeRio:null,creationFeeRusd:null,creationFeeUsd:null,creationFeeUsdt:null,configuredReferenceCreationFeeRusd:10,referenceFeeAuthority:"configuration_only_not_executable_quote",liquidityGrades:{minister:{label:"Minister",minRusd:500,maxRusd:1000,minRio:null,maxRio:null},seniorMinister:{label:"Senior Minister",minRusd:1000,maxRusd:10000,minRio:null,maxRio:null},primeMinister:{label:"Prime Minister",minRusd:10000,maxRusd:null,minRio:null,maxRio:null}},tierAmountMeaning:"selected_launch_liquidity_grade_in_existing_UI",boundarySemantics:"owner_confirmation_required_at_shared_endpoints",valuationSource:null,valuationAuthority:null}},
  valuation:{rioRusd:null,rioUsd:null,rioUsdt:null,authoritative:false},nexus:{available:false,authority:false,integrationContract:"separate_authenticated_advisory_service"}});
}
