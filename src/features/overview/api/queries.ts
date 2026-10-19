import { queryOptions } from '@tanstack/react-query';
import { getDashboardSummary } from './service';

export const overviewKeys = {
  all: ['overview'] as const,
  summary: () => [...overviewKeys.all, 'summary'] as const
};

export const REFRESH_MS = 10_000;

export const overviewSummaryQueryOptions = () =>
  queryOptions({
    queryKey: overviewKeys.summary(),
    queryFn: () => getDashboardSummary(),
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false
  });
