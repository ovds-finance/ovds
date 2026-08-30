/**
 * useOrpc — type-safe data-fetching hooks backed by the @ovds/contracts oRPC router.
 *
 * These are thin wrappers around @tanstack/react-query + @orpc/react-query.
 * They replace the hand-rolled useApiQuery / useApiCrud hooks with zero-maintenance
 * type safety: change a Zod schema in packages/contracts and TypeScript surfaces
 * the break here immediately.
 *
 * Usage:
 *   // List invoices (type inferred from contract — no manual generics)
 *   const { data, isLoading } = useOrpcQuery(
 *     orpcUtils.ovds.invoices.list.queryOptions({ page: 1, limit: 20 })
 *   );
 *
 *   // Create invoice
 *   const create = useOrpcMutation(orpcUtils.ovds.invoices.create.mutationOptions());
 *   create.mutate({ customerName: 'Acme Corp', ... });
 *
 *   // Invalidate after mutation
 *   const qc = useQueryClient();
 *   qc.invalidateQueries(orpcUtils.ovds.invoices.list.queryOptions());
 */

export {
  // Re-export React Query primitives so consumers import from one place
  useQuery     as useOrpcQuery,
  useMutation  as useOrpcMutation,
  useInfiniteQuery as useOrpcInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Re-export the orpc utils so consumers don't need to import from two places
export { orpc, orpcUtils } from '../lib/orpc';
