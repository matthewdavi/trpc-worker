import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../../trpc/client";
import { VList } from "virtua";
import { z } from "zod";
import { Suspense } from "react";

export const Route = createFileRoute("/name-search/main-thread")({
  component: RouteComponent,
  wrapInSuspense: true,
  pendingComponent: () => <div>Loading...</div>,
  validateSearch: z.object({
    count: z.number().min(1).max(1_000_000).default(1_000_000),
    nameType: z.enum(["fullName", "firstName", "lastName"]).default("fullName"),
    filter: z.string().optional().default(""),
  }),
  loaderDeps(opts) {
    return {
      count: opts.search.count,
      nameType: opts.search.nameType,
      filter: opts.search.filter,
    };
  },
  async loader(ctx) {
    // await ctx.context.trpc.faker.filterNames.fetch({
    //   count: ctx.deps.count,
    //   nameType: ctx.deps.nameType,
    //   searchTerm: ctx.deps.filter ?? "",
    // });
  },
});

function RouteComponent() {
  const { filter = "" } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <div className="text-2xl font-bold">Names </div>
      <div className="max-w-4xl mx-auto">
        <input
          type="text"
          value={filter}
          onChange={(e) => navigate({ search: { filter: e.target.value } })}
          className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
            bg-white shadow-md placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200"
          placeholder="Type to search..."
        />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <QueryData />
      </Suspense>
    </div>
  );
}

function QueryData() {
  const { count, nameType, filter = "" } = Route.useSearch();
  const namesQuery = trpc.faker.filterNames.useQuery({
    count,
    nameType,
    searchTerm: "",
  });
  if (!namesQuery.data) return null;
  const names = namesQuery.data;
  const filteredNames = names.filter((name) =>
    name.name.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <VList
      style={{ height: "500px" }}
      className="w-full flex-flex-col justify-center items-center"
    >
      {filteredNames?.map((person) => <div key={person.id}>{person.name}</div>)}
    </VList>
  );
}
