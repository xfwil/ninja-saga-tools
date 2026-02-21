export type BossGrade = 'C' | 'B' | 'A' | 'S';

export interface Boss {
  id: string;
  name: string;
  lvl: number;
  grade: BossGrade;
  xp: number;
  gold: number;
}

export const MAX_FIGHTS = 3;

export const bosses: Boss[] = [
  { id: 'boss_01', name: 'Kamaitachi',        lvl: 10, grade: 'C', xp: 3000,  gold: 5000  },
  { id: 'boss_02', name: 'Hell Horse',         lvl: 20, grade: 'C', xp: 6000,  gold: 10000 },
  { id: 'boss_03', name: 'Kabutomushi Musha',  lvl: 25, grade: 'B', xp: 8000,  gold: 12500 },
  { id: 'boss_04', name: 'Kinkaku & Ginkaku',  lvl: 30, grade: 'B', xp: 10000, gold: 15000 },
  { id: 'boss_05', name: 'Thunder Eagle',      lvl: 40, grade: 'A', xp: 15000, gold: 20000 },
  { id: 'boss_06', name: 'Mammoth King',       lvl: 50, grade: 'A', xp: 20000, gold: 25000 },
  { id: 'boss_07', name: 'Ocean Queen',        lvl: 55, grade: 'S', xp: 25000, gold: 30000 },
  { id: 'boss_08', name: 'Ghost Soldier',      lvl: 60, grade: 'S', xp: 30000, gold: 35000 },
  { id: 'boss_09', name: 'Battle Angel',       lvl: 70, grade: 'S', xp: 40000, gold: 40000 },
  { id: 'boss_10', name: 'Infernal Chimera',   lvl: 80, grade: 'S', xp: 50000, gold: 50000 },
  { id: 'boss_11', name: 'Taowu & Taotie',     lvl: 90, grade: 'S', xp: 70000, gold: 75000 },
];

export const gradeConfig: Record<BossGrade, { label: string; color: string; bg: string; border: string }> = {
  C: { label: 'C', color: 'text-slate-300',  bg: 'bg-slate-700',  border: 'border-slate-500'  },
  B: { label: 'B', color: 'text-blue-300',   bg: 'bg-blue-900/50', border: 'border-blue-500'   },
  A: { label: 'A', color: 'text-amber-300',  bg: 'bg-amber-900/50',border: 'border-amber-500'  },
  S: { label: 'S', color: 'text-red-300',    bg: 'bg-red-900/50',  border: 'border-red-500'    },
};
