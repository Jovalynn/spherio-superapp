export type Locale = "en" | "fr" | "es" | "zh";

export const translations: Record<Locale, any> = {
  en: {
    overview: "Sovereign Monetary Overview",
    totalSupply: "Total Supply",
    bonded: "Bonded Stake",
    circulating: "Circulating Supply",
    reserves: "Protocol Reserves"
  },
  fr: {
    overview: "Vue Monétaire Souveraine",
    totalSupply: "Offre Totale",
    bonded: "Stake Lié",
    circulating: "Offre en Circulation",
    reserves: "Réserves du Protocole"
  },
  es: {
    overview: "Resumen Monetario Soberano",
    totalSupply: "Suministro Total",
    bonded: "Stake Vinculado",
    circulating: "Suministro Circulante",
    reserves: "Reservas del Protocolo"
  },
  zh: {
    overview: "主权货币概览",
    totalSupply: "总供应量",
    bonded: "质押数量",
    circulating: "流通供应",
    reserves: "协议储备"
  }
};
