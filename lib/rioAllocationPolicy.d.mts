export type RioApprovedAllocation = Readonly<{
  key: string;
  label: string;
  amount: number;
}>;

export const RIO_APPROVED_ALLOCATIONS: readonly RioApprovedAllocation[];
export const RIO_APPROVED_NOMINAL_TOTAL: number;
