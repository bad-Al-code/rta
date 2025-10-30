import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  correlationId: string;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export const requstContextMiddleware = (
  contextProvider: () => RequestContext,
  next: () => void
) => {
  requestContextStore.run(contextProvider(), next);
};

export const getRequestContext = (): RequestContext | undefined => {
  return requestContextStore.getStore();
};
