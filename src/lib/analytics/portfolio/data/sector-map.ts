/**
 * Sector Classification Map
 *
 * Maps instrument tickers to their corresponding sector classifications
 */

import type { SectorType } from '@/types/analytics';

// Sector classification by ticker
export const SECTOR_MAP: Record<string, SectorType> = {
  // Finance
  SBER: 'finance',
  SBERP: 'finance',
  VTB: 'finance',
  TCSG: 'finance',
  SOFL: 'finance',

  // Energy
  GAZP: 'energy',
  LKOH: 'energy',
  ROSN: 'energy',
  NVTK: 'energy',
  TATN: 'energy',
  TATNP: 'energy',
  SIBN: 'energy',

  // Materials
  GMKN: 'materials',
  NLMK: 'materials',
  CHMF: 'materials',
  MAGN: 'materials',
  ALRS: 'materials',

  // Tech
  YNDX: 'tech',
  VKCO: 'tech',
  OZON: 'tech',

  // Telecom
  MTSS: 'telecom',
  RTKM: 'telecom',
  RTKMP: 'telecom',

  // Consumer
  MGNT: 'consumer',
  FIVE: 'consumer',
  FIXP: 'consumer',

  // Utilities
  IRAO: 'utilities',
  FEES: 'utilities',
  HYDR: 'utilities',

  // Real Estate
  LSRG: 'realestate',
  PIKK: 'realestate',

  // Industrial
  AFLT: 'industrial',
  PHOR: 'industrial',

  // US Tech
  AAPL: 'tech',
  MSFT: 'tech',
  GOOGL: 'tech',
  AMZN: 'tech',
  META: 'tech',
  NVDA: 'tech',
  TSLA: 'tech',
};
