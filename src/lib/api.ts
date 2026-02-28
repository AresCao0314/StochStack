export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
  source: 'mock' | 'remote';
};

export async function fetchFutureSignal<T>(endpoint: string): Promise<ApiEnvelope<T>> {
  return {
    ok: true,
    data: ({ endpoint } as unknown) as T,
    source: 'mock'
  };
}
