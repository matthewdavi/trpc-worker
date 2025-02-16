import { createTRPCQueryUtils, createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../workers/trpc.worker";
import { observable } from "@trpc/server/observable";
import { QueryClient } from "@tanstack/react-query";
import TRPCWorker from "../workers/trpc.worker?worker";

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
        () => new TRPCWorker()
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

const responseIdCount = new Map<string, number>();
export const trpcClient = trpc.createClient({
  links: [
    () =>
      ({ op }) =>
        observable((observer) => {
          const trpcWorker = TRPCWorkerPool.getWorker();
          const requestId = crypto.randomUUID();

          // Create a dedicated MessageChannel for this request.
          const channel = new MessageChannel();

          channel.port1.onmessage = (event: MessageEvent) => {
            const {
              result,
              error,
              success,
              requestId: responseId,
            } = event.data;
            responseIdCount.set(
              responseId,
              (responseIdCount.get(responseId) ?? 0) + 1
            );
            if (requestId !== responseId) {
              console.log("requestId !== responseId", requestId, responseId);
              debugger;
              return;
            }

            if (success) {
              observer.next({ result: { data: result } });
              observer.complete();
            } else {
              observer.error(error);
            }

            // Clean up the dedicated port now that we're done.
            channel.port1.close();
          };

          // Transfer the other port along with the request.
          trpcWorker.postMessage(
            {
              type: op.type,
              path: op.path,
              input: op.input,
              requestId,
            },
            [channel.port2]
          );
        }),
  ],
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 100, // sending huge responses, so we need to gc them
      staleTime: 100,
    },
  },
});
export const clientUtils = createTRPCQueryUtils({
  queryClient,
  client: trpcClient,
});

// Export cleanup method if needed elsewhere
export const cleanupWorkerPool = () => TRPCWorkerPool.cleanup();
