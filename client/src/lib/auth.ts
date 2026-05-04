let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _tokenGetter = fn;
}

export async function getAuthToken(): Promise<string | null> {
  return _tokenGetter?.() ?? null;
}
