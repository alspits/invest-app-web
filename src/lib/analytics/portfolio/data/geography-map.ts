/**
 * Geography Classification Map
 *
 * Maps instrument tickers to their corresponding geographic regions
 */

import type { GeographyType } from '@/types/analytics';

// Geography classification by ticker
export const GEOGRAPHY_MAP: Record<string, GeographyType> = {
  // Russian stocks
  SBER: 'russia',
  SBERP: 'russia',
  GAZP: 'russia',
  LKOH: 'russia',
  GMKN: 'russia',
  YNDX: 'russia',
  VTB: 'russia',
  MTSS: 'russia',
  ROSN: 'russia',
  NVTK: 'russia',
  NLMK: 'russia',
  VKCO: 'russia',
  OZON: 'russia',
  TATN: 'russia',
  TATNP: 'russia',
  MGNT: 'russia',
  FIVE: 'russia',
  IRAO: 'russia',
  CHMF: 'russia',
  RTKM: 'russia',
  RTKMP: 'russia',
  TCSG: 'russia',
  ALRS: 'russia',
  MAGN: 'russia',
  SIBN: 'russia',
  FEES: 'russia',
  HYDR: 'russia',
  LSRG: 'russia',
  PIKK: 'russia',
  FIXP: 'russia',
  SOFL: 'russia',
  AFLT: 'russia',
  PHOR: 'russia',

  // US stocks
  AAPL: 'usa',
  MSFT: 'usa',
  GOOGL: 'usa',
  AMZN: 'usa',
  META: 'usa',
  NVDA: 'usa',
  TSLA: 'usa',
};
