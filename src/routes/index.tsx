import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../trpc/client";
import { z } from "zod";
export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: z.object({
    name: z.string().default(""),
  }),
});

function HomeComponent() {
  const search = Route.useSearch();
  const name = search.name;
  const navigate = Route.useNavigate();

  const greeting = trpc.greeting.greeting.useQuery(
    { name: name },
    { enabled: name?.length > 0 }
  );

  const incrementMutation = trpc.greeting.increment.useMutation();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">tRPC Web Worker Demo</h1>

      <div className="mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => navigate({ search: { name: e.target.value } })}
          placeholder="Enter your name"
          className="border p-2 mr-2"
        />
        {greeting.isLoading && <span>Loading...</span>}
        {greeting.data && <p className="mt-2">{greeting.data.greeting}</p>}
        {greeting.error && (
          <p className="text-red-500">Error: {greeting.error.message}</p>
        )}
      </div>

      <div>
        <p className="mb-2">Counter: {incrementMutation.data?.newValue ?? 0}</p>
        <button
          onClick={() =>
            incrementMutation.mutate({
              value: incrementMutation.data?.newValue ?? 0,
            })
          }
          disabled={incrementMutation.isPending}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {incrementMutation.isPending ? "Incrementing..." : "Increment"}
        </button>
      </div>
    </div>
  );
}
