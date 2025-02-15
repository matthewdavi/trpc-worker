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
  try {
    const { type, path, input, requestId } = event.data;
    console.log(event);
    const result = await (caller as any)[path](input);
    console.log(result, "sending this result");
    self.postMessage({
      success: true,
      result,
      requestId,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      requestId: event.data.requestId,
    });
  }
};
