-- CreateTable
CREATE TABLE "admin_requests" (
    "request_id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "clan_id" INTEGER NOT NULL,
    "message" VARCHAR(256),
    "status" VARCHAR(20) NOT NULL,
    "reviewed_by" VARCHAR(255),
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" SERIAL NOT NULL,
    "actor_id" VARCHAR(255) NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "clan_id" INTEGER,
    "target_user_id" VARCHAR(255),
    "details" TEXT,
    "result" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "idx_admin_request_user" ON "admin_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_admin_request_clan" ON "admin_requests"("clan_id");

-- CreateIndex
CREATE INDEX "idx_admin_request_status" ON "admin_requests"("status");

-- CreateIndex
CREATE INDEX "idx_admin_request_created" ON "admin_requests"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_log_actor" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_action" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "idx_audit_log_entity_type" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "idx_audit_log_clan" ON "audit_logs"("clan_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_target" ON "audit_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_created" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE SET NULL ON UPDATE CASCADE;
