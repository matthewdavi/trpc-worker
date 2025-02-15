import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../../trpc/client";
import { VList } from "virtua";
import { z } from "zod";
import { Suspense } from "react";

export const Route = createFileRoute("/name-search/worker")({
  component: RouteComponent,
  wrapInSuspense: true,
  pendingComponent: () => <div>Loading...</div>,
  validateSearch: z.object({
    count: z.number().min(1).max(1_000_000).default(1_000_000),
    nameType: z.enum(["fullName", "firstName", "lastName"]).default("fullName"),
    filter: z.string().optional(),
  }),
  loaderDeps(opts) {
    return {
      count: opts.search.count,
      nameType: opts.search.nameType,
      filter: opts.search.filter,
    };
  },
  async loader(ctx) {},
});

function RouteComponent() {
  const { filter } = Route.useSearch();
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
  const { count, nameType, filter } = Route.useSearch();
  const namesQuery = trpc.faker.filterNames.useQuery(
    {
      count,
      nameType,
      searchTerm: filter ?? "",
    },
    { placeholderData: (prev) => prev }
  );

  const names = namesQuery.data;
  console.log(names, filter, "rendered");
  return (
    <div className="w-full flex flex-col gap-4 items-center justify-center">
      {namesQuery.isLoading && (
        <div className="flex justify-center flex-col">
          <div className="text-lg font-bold">Fetching...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 border-4" />
        </div>
      )}
      {names?.length} names
      <VList
        style={{ height: "500px" }}
        className="w-full flex-flex-col justify-center items-center"
      >
        {names?.map((person) => <div key={person.id}>{person.name}</div>)}
      </VList>
    </div>
  );
}
