import { trpc, trpcClient, queryClient } from "./client";
import { QueryClientProvider } from "@tanstack/react-query";

export const TrpcProvider = trpc.Provider;

export function WorkerTRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <TrpcProvider client={trpcClient} queryClient={queryClient}>
        {children}
      </TrpcProvider>
    </QueryClientProvider>
  );
}
