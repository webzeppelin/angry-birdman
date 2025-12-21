import { type FastifyInstance } from 'fastify';
/**
 * Create a test instance of the Fastify application
 */
export declare function createTestApp(): Promise<FastifyInstance>;
/**
 * Factory functions for creating test data
 */
export declare const testData: {
    /**
     * Create a test clan
     */
    createClan(data: {
        name: string;
        rovioId?: number;
        country?: string;
        active?: boolean;
    }): Promise<{
        name: string;
        createdAt: Date;
        rovioId: number;
        country: string;
        active: boolean;
        clanId: number;
        updatedAt: Date;
        registrationDate: Date;
    }>;
    /**
     * Create a test user
     */
    createUser(data: {
        userId: string;
        email: string;
        username: string;
        clanId?: number;
        owner?: boolean;
    }): Promise<{
        createdAt: Date;
        username: string;
        email: string;
        clanId: number | null;
        userId: string;
        owner: boolean;
        updatedAt: Date;
        enabled: boolean;
        roles: string[];
    }>;
    /**
     * Create a test roster member
     */
    createRosterMember(data: {
        clanId: number;
        playerName: string;
        active?: boolean;
    }): Promise<{
        createdAt: Date;
        active: boolean;
        clanId: number;
        leftDate: Date | null;
        kickedDate: Date | null;
        joinedDate: Date;
        playerName: string;
        playerId: number;
        updatedAt: Date;
    }>;
    /**
     * Create a test clan battle with calculated fields
     */
    createClanBattle(data: {
        battleId: string;
        clanId: number;
        startDate: Date;
        endDate: Date;
        score: number;
        baselineFp: number;
        opponentName: string;
        opponentScore: number;
        opponentFp: number;
    }): Promise<{
        battleId: string;
        createdAt: Date;
        clanId: number;
        startDate: Date;
        endDate: Date;
        opponentRovioId: number;
        opponentName: string;
        opponentCountry: string;
        score: number;
        baselineFp: number;
        opponentScore: number;
        opponentFp: number;
        fp: number;
        result: number;
        ratio: number;
        averageRatio: number;
        projectedScore: number;
        marginRatio: number;
        fpMargin: number;
        nonplayingCount: number;
        nonplayingFpRatio: number;
        reserveCount: number;
        reserveFpRatio: number;
        updatedAt: Date;
    }>;
    /**
     * Create test player stats for a battle
     * Note: Must create corresponding RosterMember first
     */
    createPlayerStats(data: {
        battleId: string;
        clanId: number;
        playerId: number;
        rank: number;
        score: number;
        fp: number;
        actionCode?: string;
    }): Promise<{
        battleId: string;
        createdAt: Date;
        clanId: number;
        score: number;
        playerId: number;
        rank: number;
        fp: number;
        actionCode: string;
        actionReason: string | null;
        ratio: number;
        updatedAt: Date;
        ratioRank: number;
    }>;
    /**
     * Create action code lookup entry
     */
    createActionCodeLookup(actionCode: string, displayName: string): Promise<{
        createdAt: Date;
        actionCode: string;
        updatedAt: Date;
        displayName: string;
    }>;
};
/**
 * Generate a mock JWT token for testing
 * Note: This creates a token structure but won't be cryptographically valid
 * For actual auth testing, use Keycloak test tokens
 */
export declare function createMockJWT(payload: {
    sub: string;
    email: string;
    preferred_username: string;
    clanId?: number;
    realm_access?: {
        roles: string[];
    };
}): string;
/**
 * Sleep utility for async test delays
 */
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=test-helpers.d.ts.map