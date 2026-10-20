declare module 'mysql2/promise' {
  import { Pool, PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2';

  export function createPool(config?: PoolOptions): Pool;
  export { Pool, ResultSetHeader, RowDataPacket };
}