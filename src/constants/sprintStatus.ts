// Sprint status mapping for display
export const SprintStatusMap: Record<string, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

export type SprintStatus = keyof typeof SprintStatusMap;
