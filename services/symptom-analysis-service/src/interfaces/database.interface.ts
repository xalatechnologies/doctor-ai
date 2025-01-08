/**
 * Represents a database query condition.
 */
export interface DatabaseQuery {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'match';
  value: unknown;
}

/**
 * Represents database query options for filtering, sorting, and pagination.
 */
export interface DatabaseQueryOptions {
  filters?: DatabaseQuery[];
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  limit?: number;
  offset?: number;
} 