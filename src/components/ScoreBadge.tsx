import { getScoreColor, getScoreRingColor } from '../types';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreRingColor(score);
  const textColor = getScoreColor(score);

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  const textSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const labelSize = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${textSize[size]} font-bold ${textColor}`}>{score}</span>
        <span className={`${labelSize[size]} text-gray-500 font-medium`}>/ 100</span>
      </div>
    </div>
  );
}
