export const TOP_NAV = [
  { key: "overview", label: "Overview", href: "/overview" },
  { key: "launch", label: "Launch", href: "/createtoken" },
  { key: "terminals", label: "Terminals", href: "/rio" },
  { key: "riodex", label: "RioDex", href: "/riodex" },
  { key: "rioexplorer", label: "RioExplorer", href: "/rioexplorer" },
  { key: "utilities", label: "Utilities", href: "/utilities" },
] as const;

export const SECTION_NAV_MAP = {
  overview: [
    { label: "Dashboard", href: "/overview", icon: "LayoutDashboard" },
    { label: "Ecosystem", href: "/overview#ecosystem", icon: "Globe" },
    { label: "Roadmap", href: "/overview#roadmap", icon: "Map" },
    { label: "Docs", href: "/overview#docs", icon: "BookOpen" },
    { label: "Governance", href: "/overview#governance", icon: "Vote" },
    { label: "System Status", href: "/overview#status", icon: "Activity" },
  ],
  launch: [
    { label: "CreateToken", href: "/createtoken", icon: "Rocket" },
    { label: "Pump.live", href: "/pump.live", icon: "Flame", badge: "Soon" },
    { label: "AdvancedLaunch", href: "/advancedlaunch", icon: "Shield", badge: "Hold" },
    { label: "Token Registry", href: "/spo20", icon: "Library" },
    { label: "My Launches", href: "/createtoken#my-launches", icon: "FolderOpen" },
  ],
  terminals: [
    { label: "RIO", href: "/rio", icon: "Coins" },
    { label: "RUSD", href: "/rusd", icon: "Landmark" },
  ],
  riodex: [
    { label: "Home", href: "/riodex", icon: "House" },
    { label: "Markets", href: "/riodex/markets", icon: "ChartNoAxesCombined" },
    { label: "Swap", href: "/riodex/swap", icon: "ArrowLeftRight" },
    { label: "Liquidity", href: "/riodex/liquidity", icon: "Droplets" },
    { label: "Pools", href: "/riodex/markets", icon: "Boxes" },
    { label: "Terminal", href: "/riodex/pool/rio1ma0g752dl0yujasnfs9yrk6uew7d0a2zrgvg62cfnlfftu2y0egqgpztmq", icon: "CandlestickChart" },
  ],
  rioexplorer: [
    { label: "Overview", href: "/rioexplorer", icon: "Compass" },
    { label: "Blocks", href: "/rioexplorer#blocks", icon: "Boxes" },
    { label: "Transactions", href: "/rioexplorer#transactions", icon: "Receipt" },
    { label: "Accounts", href: "/rioexplorer#accounts", icon: "Users" },
    { label: "SPO-20", href: "/rioexplorer/spo20", icon: "Coins" },
    { label: "Contracts", href: "/rioexplorer#contracts", icon: "FileCode2" },
    { label: "Markets", href: "/riodex/markets", icon: "BarChart3" },
  ],
  utilities: [
    { label: "RioPay", href: "/utilities#riopay", icon: "Wallet" },
    { label: "RioEx", href: "/utilities#rioex", icon: "Store" },
    { label: "Bridge", href: "/utilities#bridge", icon: "Waypoints" },
    { label: "SDK", href: "/utilities#sdk", icon: "Code2" },
    { label: "API", href: "/utilities#api", icon: "Braces" },
    { label: "Settings", href: "/utilities#settings", icon: "Settings" },
  ],
} as const;

export function getActiveSection(pathname: string) {
  if (pathname.startsWith("/riodex")) return "riodex";
  if (pathname.startsWith("/rioexplorer")) return "rioexplorer";
  if (pathname.startsWith("/rio") || pathname.startsWith("/rusd")) return "terminals";
  if (
    pathname.startsWith("/createtoken") ||
    pathname.startsWith("/advancedlaunch") ||
    pathname.startsWith("/pump.live") ||
    pathname.startsWith("/spo20")
  ) return "launch";
  if (pathname.startsWith("/utilities")) return "utilities";
  return "overview";
}
