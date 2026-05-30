import { api, unwrapResponse } from "./axios";
import type { Statistics } from "../types";

interface ApiStatistics extends Omit<Statistics, "tasksByPriority" | "upcomingDeadlines" | "overdueTasks2"> {
  taskByPriority: Record<string, number>;
  upcomingDeadline: Statistics["upcomingDeadlines"];
  overdueTask2: Statistics["overdueTasks2"];
}

function normalizeStatistics(statistics: ApiStatistics): Statistics {
  return {
    totalTasks: statistics.totalTasks,
    completedTasks: statistics.completedTasks,
    inProgressTasks: statistics.inProgressTasks,
    overdueTasks: statistics.overdueTasks,
    completionRate: statistics.completionRate,
    tasksByStatus: statistics.tasksByStatus,
    tasksByType: statistics.tasksByType,
    tasksByPriority: statistics.taskByPriority,
    memberStats: statistics.memberStats,
    upcomingDeadlines: statistics.upcomingDeadline,
    overdueTasks2: statistics.overdueTask2,
  };
}

export const statisticsApi = {
  async getByBoard(boardId: number) {
    return normalizeStatistics(
      await unwrapResponse<ApiStatistics>(api.get(`/boards/${boardId}/statistics`))
    );
  },
};
