import { atom } from 'jotai';

const lastErrorBaseAtom = atom<Error | null>(null);

export const lastErrorAtom = atom(
  get => get(lastErrorBaseAtom),
  (_, set, error: Error | null) => {
    set(lastErrorBaseAtom, error);
  },
);

lastErrorAtom.onMount = setAtom => {
  const errorListener = (event: ErrorEvent) => {
    if (event.error instanceof Error) {
      event.preventDefault();
      setAtom(event.error);
    }
  };
  window.addEventListener('error', errorListener);

  const rejectionListener = (event: PromiseRejectionEvent) => {
    if (event.reason instanceof Error) {
      event.preventDefault();
      setAtom(event.reason);
    }
  };
  window.addEventListener('unhandledrejection', rejectionListener);

  return () => {
    window.removeEventListener('error', errorListener);
    window.removeEventListener('unhandledrejection', rejectionListener);
  };
};
