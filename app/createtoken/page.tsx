"use client";

import Link from "next/link";

function heroPill(tone: "neutral" | "pump" | "prime" = "neutral") {
  const tones = {
    neutral:
      "border-slate-200/80 bg-white/80 text-slate-700 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)]",
    pump:
      "border-fuchsia-300/60 bg-fuchsia-500/10 text-fuchsia-700 shadow-[0_10px_30px_-18px_rgba(192,38,211,0.35)]",
    prime:
      "border-amber-300/70 bg-amber-500/12 text-amber-800 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.35)]",
  };

  return `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur-xl ${tones[tone]}`;
}

function shellCard(extra = "") {
  return `rounded-[30px] border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_30px_80px_-42px_rgba(120,53,15,0.22)] ${extra}`;
}

function modeCard(mode: "pump" | "prime") {
  if (mode === "pump") {
    return "rounded-[32px] border border-fuchsia-300/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(252,231,243,0.48))] p-7 backdrop-blur-2xl shadow-[0_35px_90px_-42px_rgba(217,70,239,0.32)]";
  }

  return "rounded-[32px] border border-amber-300/60 bg-[linear-gradient(180deg,rgba(255,250,240,0.92),rgba(255,244,214,0.74))] p-7 backdrop-blur-2xl shadow-[0_35px_90px_-42px_rgba(245,158,11,0.28)]";
}

function featureTile(extra = "") {
  return `rounded-[24px] border border-white/70 bg-white/68 p-5 backdrop-blur-xl shadow-[0_22px_50px_-34px_rgba(15,23,42,0.22)] ${extra}`;
}

const gatewayFlow = [
  ["Create", "Define the token story, launch path, and liquidity route in one guided flow."],
  ["Go live", "A contract is deployed, surfaced instantly, and remains visible as the market opens."],
  ["Participate", "Community buys, sells, and tracks ownership while the curve builds live price discovery."],
  ["Qualify", "Trust, holder quality, volume consistency, and behavior signals shape progression."],
  ["Graduate", "Qualified tokens earn stronger visibility, exchange pathways, and ecosystem expansion."],
  ["Scale", "Creators continue with Prime, liquidity support, listings, dashboards, and long-term utility."],
];

const pumpSignals = [
  "Live curve activity",
  "Buy and sell panel",
  "Holder breakdown by %",
  "Clickable contract surface",
  "Graduation progress rail",
  "Immediate liquidity path",
];

const primeProtections = [
  "Liquidity lock by default",
  "Vesting schedules for team allocations",
  "Wallet limits to reduce early whale pressure",
  "Transparent contract and allocation view",
  "Behavior monitoring and suspicious activity flags",
  "Safety, transparency, and reputation scoring",
];

const aiOutputs = [
  "Tokenomics design",
  "Supply distribution",
  "Utility design",
  "Suggested roadmap",
  "Launch configuration guidance",
  "Market-readiness prompts",
];

const powerUps = [
  "Community ignition",
  "Revenue engine",
  "Governance stack",
  "Game economy",
  "Creator network",
  "AI utility",
  "Asset-backed structure",
  "Growth + incentives",
];

const ecosystemLinks = [
  ["Screener", "Discovery, ranking, graduation visibility", "/riodex/markets"],
  ["RioEx", "Trading, execution, pair intelligence", "/rioex/markets"],
  ["Liquidity", "Pool creation and LP management", "/riodex/liquidity"],
  ["RioExplorer", "Contract truth, activity, and transparency", "/rioexplorer"],
];

export default function CreateTokenGatewayPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_50%_18%,rgba(244,114,182,0.12),transparent_22%),linear-gradient(180deg,#f6efe8_0%,#f2e8df_38%,#eee3d8_72%,#f8f1ea_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[-8%] top-[-8%] h-72 w-72 rounded-full bg-orange-300/25 blur-3xl" />
        <div className="absolute right-[-6%] top-[10%] h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="absolute bottom-[8%] left-[22%] h-72 w-72 rounded-full bg-amber-200/28 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8">
        <section className={shellCard("p-8 md:p-10")}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={heroPill()}>SpherioChain • CreateToken</span>
            <span className={heroPill("prime")}>Prime = institutional gold</span>
            <span className={heroPill("pump")}>Pump.live = high-energy curve launch</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.22em] text-orange-800/90">
                Launch gateway
              </div>

              <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Create tokens that look alive on day one and credible over time
              </h1>

              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700 md:text-lg">
                Choose a fast bonding-curve launch or a more structured institutional route.
                The gateway now speaks clearly to both audiences:{" "}
                <span className="font-semibold text-slate-950">Pump.live</span> for immediate
                market energy, and <span className="font-semibold text-slate-950">Prime</span>{" "}
                for stronger trust architecture, utility design, and long-term readiness.
              </p>

              <div className="mt-8 rounded-[26px] border border-orange-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,244,232,0.82))] p-5 shadow-[0_20px_70px_-38px_rgba(120,53,15,0.24)]">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-orange-800">
                  Mode switch
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  What are you creating today?
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-fuchsia-300/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(250,232,255,0.86))] p-4">
                    <div className="text-xl font-semibold text-slate-950">🔥 “Something viral”</div>
                    <div className="mt-1 text-sm font-medium text-fuchsia-700">
                      Meme Mode → Pump.live
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">
                      Immediate curve-based launch, trading-style experience, and visible
                      momentum mechanics.
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-amber-300/60 bg-[linear-gradient(135deg,rgba(255,251,235,0.94),rgba(255,243,214,0.88))] p-4">
                    <div className="text-xl font-semibold text-slate-950">
                      🧠 “Something valuable”
                    </div>
                    <div className="mt-1 text-sm font-medium text-amber-700">
                      Prime Mode → Structured Launch
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">
                      Utility-led token creation with anti-rug defaults, stronger trust framing,
                      and institutional polish.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={featureTile(
                "border-orange-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,245,236,0.82))]",
              )}
            >
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-orange-800">
                Choose your lane
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Two distinct creation paths with different personalities
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Keep the gateway public-facing and simple. Pump.live should feel more vibrant and
                trade-oriented, while Prime should feel more serious, structured, and credible.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  "Pump.live for fast meme-style launches",
                  "Prime for institutional, utility-led projects",
                  "Trust indicators visible before buying",
                  "Graduation pathways based on quality",
                  "Clickable contracts and transparency",
                  "Deeper protections in Prime Mode",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/80 bg-white/74 px-4 py-3 text-sm font-medium text-slate-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className={modeCard("pump")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={heroPill("pump")}>Pump.live</span>
              <span className={heroPill()}>Meme energy, not casino chaos</span>
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              A livelier launch lane with a trading-style surface
            </h2>

            <p className="mt-4 text-sm leading-8 text-slate-700">
              Pump.live should not wear the same suit as Prime. This route should feel closer to a
              modern meme launch terminal: brighter, faster, more social, and more market-native,
              while still preserving credibility and visible controls.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {pumpSignals.map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-fuchsia-200/70 bg-white/74 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-[26px] border border-fuchsia-300/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(252,231,243,0.76))] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">
                    Surface preview
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    Contract appears instantly and stays clickable
                  </div>
                </div>
                <span className={heroPill("pump")}>Curve active</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[22px] border border-fuchsia-200/70 bg-white/80 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-950">$TOKEN / RIO</span>
                    <span className="text-fuchsia-700">Bonding curve live</span>
                  </div>
                  <div className="mt-4 h-40 rounded-[18px] border border-dashed border-fuchsia-300/60 bg-[linear-gradient(180deg,rgba(253,242,248,0.88),rgba(255,255,255,0.88))] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Curve / chart area
                    </div>
                    <div className="mt-8 flex h-16 items-end gap-2">
                      {[22, 35, 30, 48, 46, 64, 72, 88].map((h, idx) => (
                        <div
                          key={idx}
                          className="w-full rounded-t-xl bg-[linear-gradient(180deg,rgba(249,115,22,0.92),rgba(217,70,239,0.88))]"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={heroPill()}>Contract: clickable</span>
                    <span className={heroPill()}>Liquidity path active</span>
                    <span className={heroPill()}>Graduation meter visible</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[22px] border border-fuchsia-200/70 bg-white/80 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Buy / sell
                    </div>
                    <div className="mt-3 grid gap-2">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-700">
                        Buy panel
                      </div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700">
                        Sell panel
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-fuchsia-200/70 bg-white/80 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Top holders in curve
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Holder A</span>
                        <span>14.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Holder B</span>
                        <span>8.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Holder C</span>
                        <span>6.1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <Link
                href="/pump.live"
                className="inline-flex min-w-[180px] items-center justify-center rounded-2xl border border-fuchsia-300/70 bg-[linear-gradient(90deg,rgba(249,115,22,1),rgba(217,70,239,0.94))] px-6 py-4 text-base font-extrabold tracking-tight text-white shadow-[0_18px_40px_-18px_rgba(217,70,239,0.6)] transition hover:translate-y-[-1px]"
              >
                Enter Pump.live
              </Link>
            </div>
          </div>

          <div className={modeCard("prime")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={heroPill("prime")}>Prime</span>
              <span className={heroPill()}>Golden and institutional</span>
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Structured launch architecture for tokens meant to endure
            </h2>

            <p className="mt-4 text-sm leading-8 text-slate-700">
              Prime should wear a more sovereign, premium identity: golden tones, cleaner trust
              framing, deeper token design support, and stronger default protections that help users
              assess quality before they buy.
            </p>

            <div className="mt-6 rounded-[26px] border border-amber-300/65 bg-white/70 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                AI-assisted creation
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                “I want to build a token for X” should generate the right structure instantly
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {aiOutputs.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm font-medium text-slate-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[26px] border border-amber-300/65 bg-white/70 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                Power-up templates
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                Templates should feel stackable, strategic, and game-like
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Each template can bundle built-in smart contract logic, pre-configured tokenomics,
                and a dashboard-ready post-launch interface. Stackable combinations let builders
                compose more advanced project designs without unsafe feature mixing.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {powerUps.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <Link
                href="/createtoken/prime"
                className="inline-flex min-w-[180px] items-center justify-center rounded-2xl border border-amber-300/75 bg-[linear-gradient(90deg,rgba(245,158,11,1),rgba(217,119,6,0.92))] px-6 py-4 text-base font-extrabold tracking-tight text-white shadow-[0_18px_40px_-18px_rgba(217,119,6,0.55)] transition hover:translate-y-[-1px]"
              >
                Enter Prime
              </Link>
            </div>
          </div>
        </section>

        <section className={shellCard()}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={heroPill()}>Lifecycle</span>
            <span className={heroPill("prime")}>Clearer wording</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            From creation to graduation, the journey should feel directional and persuasive
          </h3>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            The old lifecycle language felt flat. This version makes the progression clearer:
            creation, activation, participation, qualification, graduation, and scale.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {gatewayFlow.map(([title, desc], idx) => (
              <div
                key={title}
                className="rounded-[24px] border border-white/70 bg-white/76 p-4 backdrop-blur-xl"
              >
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                  Step {idx + 1}
                </div>
                <div className="mt-2 text-base font-semibold text-slate-950">{title}</div>
                <div className="mt-2 text-sm leading-7 text-slate-700">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className={shellCard()}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={heroPill("prime")}>Anti-rug system</span>
              <span className={heroPill()}>Critical edge</span>
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Default trust architecture should be visible before users commit capital
            </h3>

            <div className="mt-6 grid gap-3">
              {primeProtections.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,0.9))] p-5">
              <div className="text-sm font-bold text-slate-950">Trust score system</div>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Every token can surface a visible{" "}
                <span className="font-semibold text-slate-950">Safety Score</span>,{" "}
                <span className="font-semibold text-slate-950">Transparency Score</span>, and{" "}
                <span className="font-semibold text-slate-950">Developer Reputation</span> layer so
                users can judge trust before buying.
              </p>
            </div>
          </div>

          <div className={shellCard()}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={heroPill("pump")}>Graduation</span>
              <span className={heroPill("prime")}>Rimrock path</span>
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Graduation should depend on market quality, not just price spikes
            </h3>

            <div className="mt-5 grid gap-3">
              {[
                "Market-cap threshold",
                "Liquidity remains locked",
                "Healthy holder count",
                "Volume consistency",
                "Developer behavior remains clean",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,247,237,0.95),rgba(255,255,255,0.9))] p-5">
              <div className="text-sm font-bold text-slate-950">Exchange integration moat</div>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Qualified tokens can move into a{" "}
                <span className="font-semibold text-slate-950">Rimrock graduation</span> route:
                automatic or semi-automatic listing treatment, liquidity support, stronger
                visibility, and optional application pathways where staking and verification unlock
                fee benefits and higher trust.
              </p>
            </div>
          </div>
        </section>

        <section className={shellCard()}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={heroPill()}>Connected ecosystem</span>
          </div>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Launch is only the beginning
          </h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ecosystemLinks.map(([title, desc, href]) => (
              <Link
                key={title}
                href={href}
                className="rounded-[24px] border border-white/70 bg-white/76 p-5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/86"
              >
                <div className="text-base font-semibold text-slate-950">{title}</div>
                <div className="mt-2 text-sm leading-7 text-slate-700">{desc}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,247,237,0.86))] p-8 backdrop-blur-2xl shadow-[0_32px_90px_-44px_rgba(120,53,15,0.28)]">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Choose the right launch personality from the first screen
          </h3>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            Pump.live should feel like a vibrant market-native launch terminal. Prime should feel
            golden, institutional, and deeply structured. The gateway should make that separation
            obvious within seconds.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/pump.live"
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl border border-fuchsia-300/70 bg-[linear-gradient(90deg,rgba(249,115,22,1),rgba(217,70,239,0.94))] px-6 py-4 text-base font-extrabold tracking-tight text-white shadow-[0_18px_40px_-18px_rgba(217,70,239,0.6)]"
            >
              Enter Pump.live
            </Link>
            <Link
              href="/createtoken/prime"
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl border border-amber-300/75 bg-[linear-gradient(90deg,rgba(245,158,11,1),rgba(217,119,6,0.92))] px-6 py-4 text-base font-extrabold tracking-tight text-white shadow-[0_18px_40px_-18px_rgba(217,119,6,0.55)]"
            >
              Enter Prime
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
