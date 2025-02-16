import { router } from "./trpc/base";
import { fakerRouter } from "./routers/fakerRouter";
import { greetingRouter } from "./routers/greetingRouter";

const appRouter = router({
  faker: fakerRouter,
  greeting: greetingRouter,
});

export type AppRouter = typeof appRouter;
const caller = appRouter.createCaller({});

// A Set to track aborted request IDs.
const abortedRequests = new Set<string | number>();

self.onmessage = async (event) => {
  const { type, path, input, requestId } = event.data;

  // If we receive an abort message, mark the request as aborted.
  if (type === "abort") {
    abortedRequests.add(requestId);
    console.log(`Abort message received for request ${requestId}.`);
    return;
  }

  // If this request was already marked as aborted, bail out early.
  if (abortedRequests.has(requestId)) {
    console.log(`Request ${requestId} is aborted. Skipping processing.`);
    return;
  }

  // Check if a dedicated message port was provided.
  const port = event.ports && event.ports[0];
  try {
    const startTime = performance.now();
    const result = await (caller as any)[path](input);
    const endTime = performance.now();
    console.log(`${path} took ${endTime - startTime}ms`);

    // Check again if the request was aborted while processing.
    if (abortedRequests.has(requestId)) {
      console.log(
        `Request ${requestId} aborted during processing. Not sending result.`
      );
      return;
    }

    const message = {
      success: true,
      result,
      requestId,
    };

    if (port) {
      const startPortTime = performance.now();
      port.postMessage(message);
      const endPortTime = performance.now();
      console.log(`port.postMessage took ${endPortTime - startPortTime}ms`);
    } else {
      self.postMessage(message);
    }
  } catch (error) {
    const message = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
    };

    if (port) {
      port.postMessage(message);
    } else {
      self.postMessage(message);
    }
  } finally {
    // Clean up the abort flag once processing is done.
    abortedRequests.delete(requestId);
  }
};
