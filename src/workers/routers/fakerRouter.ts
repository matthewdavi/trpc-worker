import { router, publicProcedure } from "../trpc/base";
import { z } from "zod";
import { faker } from "@faker-js/faker";

faker.seed(123);
// Generate a pool of 1 million names of each type
const NAMES_POOL = {
  fullName: Array.from({ length: 1_000_000 }, () => faker.person.fullName()),
  firstName: Array.from({ length: 1_000_000 }, () => faker.person.firstName()),
  lastName: Array.from({ length: 1_000_000 }, () => faker.person.lastName()),
};

export const fakerRouter = router({
  generateNames: publicProcedure
    .input(
      z.object({
        count: z.number().min(1).max(1000000).default(1000),
        nameType: z
          .enum(["fullName", "firstName", "lastName"])
          .default("fullName"),
        seed: z.number().optional(),
      })
    )
    .query(({ input }) => {
      const poolArray = NAMES_POOL[input.nameType];
      return poolArray.slice(0, input.count).map((name) => {
        return {
          name,
          id: crypto.randomUUID(),
        };
      });
    }),
  filterNames: publicProcedure
    .input(
      z.object({
        searchTerm: z.string(),
        nameType: z
          .enum(["fullName", "firstName", "lastName"])
          .default("fullName"),
        count: z.number().min(1).max(1000000).default(1000),
      })
    )
    .query(({ input }) => {
      const filteredNames = NAMES_POOL[input.nameType]
        .filter((name) =>
          name.toLowerCase().includes(input.searchTerm.toLowerCase())
        )
        .slice(0, input.count)
        .map((name) => {
          return {
            name,
            id: crypto.randomUUID(),
          };
        });

      return filteredNames;
    }),
});
