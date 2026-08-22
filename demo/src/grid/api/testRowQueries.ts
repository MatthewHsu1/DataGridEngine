import { apiClient, ApiError } from "../../http";
import type { FetchRowsParams, UpdateRowParams } from "@matthewhsu1/datagrid";
import type { TestRow } from "./types";

const PATH = "/api/test-rows";

/**
 * One ordered slice.
 *
 * The sort parameters are omitted rather than sent empty when nothing is
 * sorted: the client drops an undefined param, and the handler treats a missing
 * `sortField` as natural order.
 */
export async function fetchTestRows(p: FetchRowsParams<string>): Promise<TestRow[]> {
  return apiClient.get<TestRow[]>(PATH, {
    params: {
      offset: p.offset,
      limit: p.limit,
      sortField: p.sort?.field,
      sortDir: p.sort?.direction,
      nulls: p.sort?.nulls,
      collapsed: p.collapsedGroups.join(","),
    },
    signal: p.signal,
  });
}

/** The total under the current collapse state. */
export async function fetchTestRowCount(p: {
  collapsedGroups: string[];
  signal?: AbortSignal;
}): Promise<number> {
  const { count } = await apiClient.get<{ count: number }>(`${PATH}/count`, {
    params: { collapsed: p.collapsedGroups.join(",") },
    signal: p.signal,
  });

  return count;
}

/**
 * One row by id, for an id-only push notification.
 *
 * A 404 is a legitimate answer here — the row is gone — so it becomes null
 * rather than an exception. Every other failure still throws.
 */
export async function fetchTestRow(id: number, signal?: AbortSignal): Promise<TestRow | null> {
  try {
    return await apiClient.get<TestRow>(`${PATH}/${id}`, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

/**
 * Persists one cell edit.
 *
 * A rejected edit becomes `{ ok: false }` rather than an exception, because
 * that is the shape `hooks/useCellRenderer.ts` reads to trigger the rollback
 * and the error banner.
 */
export async function updateTestRow(
  p: UpdateRowParams<TestRow, number>,
): Promise<{ ok: boolean; row?: TestRow }> {
  try {
    const row = await apiClient.patch<TestRow>(`${PATH}/${p.id}`, p.changes);
    return { ok: true, row };
  } catch {
    return { ok: false };
  }
}

/** Regenerates the mock data. Returns the new row count. */
export async function resetTestRows(): Promise<number> {
  const { count } = await apiClient.post<{ count: number }>(`${PATH}/reset`);
  return count;
}
