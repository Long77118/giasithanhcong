const categoryTones = ['cream', 'sage', 'clay', 'spruce', 'wheat', 'stone'] as const;

export type HomeNewsCategoryTone = (typeof categoryTones)[number];

export function homeNewsCategoryTones(categoryIds: readonly number[]) {
  const available = new Set<HomeNewsCategoryTone>(categoryTones);
  const tones = new Map<number, HomeNewsCategoryTone>();
  for (const id of [...new Set(categoryIds)].sort((a, b) => a - b)) {
    const preferred = categoryTones[id % categoryTones.length];
    const tone = available.has(preferred) ? preferred : (available.values().next().value ?? preferred);
    tones.set(id, tone);
    available.delete(tone);
  }
  return tones;
}
