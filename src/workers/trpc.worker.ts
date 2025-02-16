import { router } from "./trpc/base";
import { fakerRouter } from "./routers/fakerRouter";
import { greetingRouter } from "./routers/greetingRouter";

const appRouter = router({
  faker: fakerRouter,
  greeting: greetingRouter,
});

export type AppRouter = typeof appRouter;
const caller = appRouter.createCaller({});
self.onmessage = async (event) => {
  console.log("received message");
  const { type, path, input, requestId } = event.data;
  // Check if a dedicated message port was provided.
  const port = event.ports && event.ports[0];

  try {
    const startTime = performance.now();
    const result = await (caller as any)[path](input);
    const endTime = performance.now();
    console.log(`${path} took ${endTime - startTime}ms`);
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
  }
};
