import * as React from "react";
import {
  Link,
  Outlet,
  createRootRoute,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { WorkerTRPCProvider } from "../trpc/provider";
import { clientUtils } from "../trpc/client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools/production";
import { AnimatedSquare } from "./name-search/-animated-square";

interface RootContext {
  trpc: typeof clientUtils;
}

export const Route = createRootRouteWithContext<RootContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <WorkerTRPCProvider>
      <div className="p-2 flex gap-2 text-lg">
        <Link
          to="/"
          activeProps={{
            className: "font-bold",
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>{" "}
        <Link
          to="/about"
          activeProps={{
            className: "font-bold",
          }}
        >
          About
        </Link>
        <Link
          to="/name-search/worker"
          activeProps={{
            className: "font-bold",
          }}
        >
          Worker Search
        </Link>
        <Link
          to="/name-search/main-thread"
          activeProps={{
            className: "font-bold",
          }}
        >
          Main Thread Search
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </WorkerTRPCProvider>
  );
}
