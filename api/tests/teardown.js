/**
 * Global teardown for test suite
 * Disconnects from database to prevent hanging connections
 */
export default async function teardown() {
    const prisma = global.__prisma_test_client;
    if (prisma) {
        await prisma.$disconnect();
    }
}
//# sourceMappingURL=teardown.js.map