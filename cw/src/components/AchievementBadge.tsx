import type { AchievementDef } from '../domain/achievements';

interface AchievementBadgeProps {
  def: AchievementDef;
  unlocked: boolean;
  size?: number;
}

const SHAPES: Record<AchievementDef['icon'], Array<[number, number, number, number]>> = {
  spark: [[4, 0, 2, 10], [0, 4, 10, 2]],
  stack: [[1, 6, 8, 3], [2, 3, 6, 3], [3, 0, 4, 3]],
  flame: [[3, 5, 4, 5], [4, 1, 2, 4], [2, 7, 6, 3]],
  island: [[1, 5, 8, 2], [2, 7, 6, 2], [4, 1, 2, 4]],
  crown: [[1, 5, 8, 4], [1, 1, 2, 4], [4, 0, 2, 5], [7, 1, 2, 4]],
  star: [[4, 0, 2, 10], [0, 4, 10, 2], [2, 2, 6, 6]],
};

export function AchievementBadge({ def, unlocked, size = 56 }: AchievementBadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className={`badge${unlocked ? ' is-unlocked' : ''}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="10" height="10" className="badge__bg" />
      {SHAPES[def.icon].map(([x, y, w, h], index) => (
        <rect key={index} x={x} y={y} width={w} height={h} className="badge__shape" />
      ))}
    </svg>
  );
}
