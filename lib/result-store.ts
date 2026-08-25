type StoredResult = {
  output: string;
  receivedAt: number;
};

const globalForResult = globalThis as typeof globalThis & {
  __n8nResult?: StoredResult;
};

export function setResult(output: string) {
  globalForResult.__n8nResult = {
    output,
    receivedAt: Date.now(),
  };
}

export function getResult(): StoredResult | null {
  return globalForResult.__n8nResult ?? null;
}

export function clearResult() {
  globalForResult.__n8nResult = undefined;
}
