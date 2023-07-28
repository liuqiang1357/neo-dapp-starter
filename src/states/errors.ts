import { proxy } from 'valtio';

export const errorsState = proxy({
  lastError: null as Error | null,
});

export function publishError(error: unknown): void {
  if (error instanceof Error) {
    errorsState.lastError = error;
  }
}

export function clearError(error: Error): void {
  if (errorsState.lastError === error) {
    errorsState.lastError = null;
  }
}

export function syncErrorsState(): () => void {
  const errorListener = (event: ErrorEvent) => {
    event.preventDefault();
    publishError(event.error);
  };

  const rejectionListener = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    publishError(event.reason);
  };

  window.addEventListener('error', errorListener);
  window.addEventListener('unhandledrejection', rejectionListener);

  return () => {
    window.removeEventListener('error', errorListener);
    window.removeEventListener('unhandledrejection', rejectionListener);
  };
}
