import { createTRPCQueryUtils, createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../workers/trpc.worker";
import { observable } from "@trpc/server/observable";
import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

class TRPCWorkerPool {
  private static readonly POOL_SIZE = 4;
  private static workers: Worker[] = [];
  private static currentIndex = 0;
  private static isInitialized = false;

  private static initialize() {
    if (!this.isInitialized) {
      this.workers = Array.from(
        { length: this.POOL_SIZE },
        () =>
          new Worker(new URL("../workers/trpc.worker.ts", import.meta.url), {
            type: "module",
          })
      );
      this.isInitialized = true;
    }
  }

  public static getWorker(): Worker {
    this.initialize();
    const worker = this.workers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.POOL_SIZE;
    return worker;
  }

  public static cleanup(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.currentIndex = 0;
    this.isInitialized = false;
  }
}

TRPCWorkerPool.getWorker();

export const trpcClient = trpc.createClient({
  links: [
    () =>
      ({ op }) =>
        observable((observer) => {
          const trpcWorker = TRPCWorkerPool.getWorker();
          const requestId = crypto.randomUUID();

          const messageHandler = (event: MessageEvent) => {
            const {
              result,
              error,
              success,
              requestId: responseId,
            } = event.data;

            if (requestId !== responseId) return;

            if (success) {
              observer.next({ result: { data: result } });
              observer.complete();
            } else {
              observer.error(error);
            }
            trpcWorker.removeEventListener("message", messageHandler);
          };

          trpcWorker.addEventListener("message", messageHandler);

          trpcWorker.postMessage({
            type: op.type,
            path: op.path,
            input: op.input,
            requestId,
          });
        }),
  ],
});

export const queryClient = new QueryClient();
export const clientUtils = createTRPCQueryUtils({
  queryClient,
  client: trpcClient,
});

// Export cleanup method if needed elsewhere
export const cleanupWorkerPool = () => TRPCWorkerPool.cleanup();
