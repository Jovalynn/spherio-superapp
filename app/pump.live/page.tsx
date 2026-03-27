export default function PumpLivePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            RioExplorer • Launch
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pump.live
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bonding-curve launchpad (post-MVP module)
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-background p-6">
        <div className="text-sm font-medium">Status</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Coming soon. Pump.live will enable permissionless bonding-curve
          token launches on Spherio.
        </div>
      </div>
    </div>
  );
}
