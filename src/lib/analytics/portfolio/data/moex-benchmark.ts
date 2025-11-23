/**
 * MOEX Benchmark Data
 *
 * Official MOEX Index benchmark weights for sector and geography allocation
 */

import type { MOEXBenchmark } from '@/types/analytics';

// MOEX Index Benchmark Weights (as of 2024)
// Source: MOEX official data
export const MOEX_BENCHMARK: MOEXBenchmark = {
  sectorWeights: {
    finance: 28.5, // Sberbank, VTB, etc.
    energy: 24.3, // Gazprom, Lukoil, Rosneft
    materials: 15.2, // Norilsk Nickel, Severstal
    telecom: 8.7, // MTS, Rostelecom
    consumer: 7.4, // Magnit, X5 Retail
    utilities: 5.6, // Inter RAO, RusHydro
    industrial: 4.8, // NLMK, TMK
    tech: 3.2, // Yandex, Mail.ru
    healthcare: 1.5, // Pharmstandard
    realestate: 0.6, // LSR Group
    other: 0.2,
  },
  geographyWeights: {
    russia: 95.0,
    europe: 2.5,
    asia: 1.5,
    usa: 0.5,
    other: 0.5,
  },
  lastUpdated: new Date('2024-01-01'),
};
