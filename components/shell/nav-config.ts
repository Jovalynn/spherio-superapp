import {
  RIODEX_HOME_ROUTE,
  RIODEX_SCREENER_ROUTE,
  RIODEX_SWAP_ROUTE,
  RIODEX_LIQUIDITY_ROUTE,
  RIODEX_POOLS_ROUTE,
  buildRioDexSurfaceHref,
} from "@/lib/riodex/routes";

const RIODEX_TERMINAL_ROUTE = buildRioDexSurfaceHref(
  "rio1ma0g752dl0yujasnfs9yrk6uew7d0a2zrgvg62cfnlfftu2y0egqgpztmq"
).pool;

export const TOP_NAV = [
  { key: "overview", label: "Overview", href: "/overview" },
  { key: "launch", label: "Launch", href: "/createtoken" },
  { key: "markets", label: "Markets", href: RIODEX_HOME_ROUTE },
  { key: "terminals", label: "Terminals", href: "/rio" },
  { key: "explorer", label: "Explorer", href: "/rioexplorer" },
  { key: "wallet", label: "Wallet", href: "/riolight" },
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
    { label: "RIO", href: "/rio", icon: "RioLogo" },
    { label: "RUSD", href: "/rusd", icon: "RusdLogo" },
  ],
  markets: [
    { label: "RioDex Home", href: RIODEX_HOME_ROUTE, icon: "House" },
    { label: "Swap", href: RIODEX_SWAP_ROUTE, icon: "ArrowLeftRight" },
    { label: "Liquidity", href: RIODEX_LIQUIDITY_ROUTE, icon: "Droplets" },
    { label: "Pools", href: RIODEX_POOLS_ROUTE, icon: "Boxes" },
    { label: "Screener", href: RIODEX_SCREENER_ROUTE, icon: "ChartNoAxesCombined" },
    { label: "RioEx", href: "/rioex", icon: "Store" },
    {
      label: "Trade Terminal",
      href: RIODEX_TERMINAL_ROUTE,
      icon: "CandlestickChart",
    },
  ],
  explorer: [
    { label: "Overview", href: "/rioexplorer", icon: "Compass" },
    { label: "Blocks", href: "/rioexplorer#blocks", icon: "Boxes" },
    { label: "Transactions", href: "/rioexplorer#transactions", icon: "Receipt" },
    { label: "Accounts", href: "/rioexplorer#accounts", icon: "Users" },
    { label: "SPO-20", href: "/rioexplorer/spo20", icon: "Library" },
    { label: "Contracts", href: "/rioexplorer#contracts", icon: "FileCode2" },
    { label: "Markets", href: RIODEX_SCREENER_ROUTE, icon: "BarChart3" },
  ],
  wallet: [
    { label: "RioLight Portfolio", href: "/riolight", icon: "Wallet" },
    { label: "Assets", href: "/riolight", icon: "Library" },
    { label: "Pump Positions", href: "/riolight", icon: "Flame" },
    { label: "Prime Allocations", href: "/riolight", icon: "Shield", badge: "Next" },
    { label: "SPO-20 Balances", href: "/riolight", icon: "Coins" },
  ],
  utilities: [
    { label: "RioPay", href: "/utilities#riopay", icon: "Wallet" },
    { label: "RioTelecom", href: "/utilities#riotelecom", icon: "Waypoints" },
    { label: "RioEdge", href: "/utilities#rioedge", icon: "Code2" },
    { label: "RioCommerce", href: "/utilities#riocommerce", icon: "Braces" },
  ],
} as const;

export function getActiveSection(pathname: string) {
  if (pathname.startsWith("/riolight") || pathname.startsWith("/wallet")) return "wallet";
  if (pathname.startsWith("/riodex") || pathname.startsWith("/rioex")) return "markets";
  if (pathname.startsWith("/rioexplorer")) return "explorer";
  if (pathname.startsWith("/rio") || pathname.startsWith("/rusd")) return "terminals";
  if (
    pathname.startsWith("/createtoken") ||
    pathname.startsWith("/advancedlaunch") ||
    pathname.startsWith("/pump.live") ||
    pathname.startsWith("/spo20")
  ) {
    return "launch";
  }
  if (pathname.startsWith("/utilities")) return "utilities";
  return "overview";
}
