import type { PrismaClient } from '@angrybirdman/database';
declare global {
    var __prisma_test_client: PrismaClient | undefined;
}
/**
 * Global teardown for test suite
 * Disconnects from database to prevent hanging connections
 */
export default function teardown(): Promise<void>;
//# sourceMappingURL=teardown.d.ts.map