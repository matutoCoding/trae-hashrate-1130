import { QueueItem, MemberLevel } from '../types';

export const getPriorityByLevel = (level: MemberLevel): number => {
  const priorities: Record<MemberLevel, number> = {
    normal: 1,
    silver: 2,
    gold: 3,
    platinum: 4,
    diamond: 5,
  };
  return priorities[level] || 1;
};

export const sortQueueByPriority = (queue: QueueItem[]): QueueItem[] => {
  return [...queue].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime();
  });
};

export const estimateWaitTime = (
  position: number,
  avgTurnoverMinutes: number = 45
): number => {
  return position * avgTurnoverMinutes;
};

export const getEstimatedWaitText = (minutes: number): string => {
  if (minutes < 60) return `约${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `约${hours}小时`;
  return `约${hours}小时${mins}分钟`;
};

export const canVipSkipQueue = (level: MemberLevel): boolean => {
  const skipLevels: MemberLevel[] = ['gold', 'platinum', 'diamond'];
  return skipLevels.includes(level);
};

export const getVipInsertPosition = (
  queue: QueueItem[],
  vipLevel: MemberLevel
): number => {
  const vipPriority = getPriorityByLevel(vipLevel);
  
  let insertIndex = 0;
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].status === 'called') {
      insertIndex = i + 1;
      continue;
    }
    if (queue[i].priority < vipPriority) {
      return i;
    }
    insertIndex = i + 1;
  }
  return insertIndex;
};
