import { router, publicProcedure } from "../trpc/base";
import { z } from "zod";

export const greetingRouter = router({
  greeting: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name}!`,
        timestamp: new Date().toISOString(),
      };
    }),
  increment: publicProcedure
    .input(z.object({ value: z.number() }))
    .mutation(({ input }) => {
      return {
        newValue: input.value + 1,
      };
    }),
});
