/**
 * Market Cap Classification Map
 *
 * Maps instrument tickers to their approximate market capitalizations in RUB
 */

// Market cap classification by ticker (in RUB, approximate values)
export const MARKET_CAP_MAP: Record<string, number> = {
  // Large cap (> 200B RUB)
  SBER: 5_000_000_000_000,
  GAZP: 3_500_000_000_000,
  LKOH: 4_200_000_000_000,
  GMKN: 2_800_000_000_000,
  ROSN: 3_100_000_000_000,
  NVTK: 2_400_000_000_000,
  NLMK: 800_000_000_000,
  YNDX: 1_200_000_000_000,
  VTB: 600_000_000_000,
  MTSS: 450_000_000_000,
  TATN: 900_000_000_000,
  IRAO: 350_000_000_000,

  // Mid cap (10B - 200B RUB)
  VKCO: 180_000_000_000,
  OZON: 150_000_000_000,
  MGNT: 120_000_000_000,
  FIVE: 95_000_000_000,
  CHMF: 85_000_000_000,
  RTKM: 70_000_000_000,
  TCSG: 65_000_000_000,
  ALRS: 55_000_000_000,
  MAGN: 45_000_000_000,
  SIBN: 40_000_000_000,
  FEES: 35_000_000_000,
  HYDR: 30_000_000_000,
  LSRG: 25_000_000_000,
  PIKK: 22_000_000_000,

  // Small cap (< 10B RUB)
  FIXP: 8_000_000_000,
  SOFL: 6_000_000_000,
  AFLT: 5_000_000_000,
  PHOR: 4_000_000_000,
};
