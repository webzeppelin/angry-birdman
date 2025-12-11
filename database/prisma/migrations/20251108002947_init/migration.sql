-- CreateTable
CREATE TABLE "clans" (
    "clan_id" SERIAL NOT NULL,
    "rovio_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "registration_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clans_pkey" PRIMARY KEY ("clan_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "clan_id" INTEGER,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "roster_members" (
    "player_id" SERIAL NOT NULL,
    "clan_id" INTEGER NOT NULL,
    "player_name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joined_date" DATE NOT NULL,
    "left_date" DATE,
    "kicked_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_members_pkey" PRIMARY KEY ("player_id")
);

-- CreateTable
CREATE TABLE "clan_battles" (
    "clan_id" INTEGER NOT NULL,
    "battle_id" VARCHAR(8) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "result" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "fp" INTEGER NOT NULL,
    "baseline_fp" INTEGER NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "average_ratio" DOUBLE PRECISION NOT NULL,
    "projected_score" DOUBLE PRECISION NOT NULL,
    "opponent_name" VARCHAR(100) NOT NULL,
    "opponent_rovio_id" INTEGER NOT NULL,
    "opponent_country" VARCHAR(100) NOT NULL,
    "opponent_score" INTEGER NOT NULL,
    "opponent_fp" INTEGER NOT NULL,
    "margin_ratio" DOUBLE PRECISION NOT NULL,
    "fp_margin" DOUBLE PRECISION NOT NULL,
    "nonplaying_count" INTEGER NOT NULL,
    "nonplaying_fp_ratio" DOUBLE PRECISION NOT NULL,
    "reserve_count" INTEGER NOT NULL,
    "reserve_fp_ratio" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clan_battles_pkey" PRIMARY KEY ("clan_id","battle_id")
);

-- CreateTable
CREATE TABLE "clan_battle_player_stats" (
    "clan_id" INTEGER NOT NULL,
    "battle_id" VARCHAR(8) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "fp" INTEGER NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "ratio_rank" INTEGER NOT NULL,
    "action_code" VARCHAR(20) NOT NULL,
    "action_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clan_battle_player_stats_pkey" PRIMARY KEY ("clan_id","battle_id","player_id")
);

-- CreateTable
CREATE TABLE "clan_battle_nonplayer_stats" (
    "clan_id" INTEGER NOT NULL,
    "battle_id" VARCHAR(8) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "fp" INTEGER NOT NULL,
    "reserve" BOOLEAN NOT NULL DEFAULT false,
    "action_code" VARCHAR(20) NOT NULL,
    "action_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clan_battle_nonplayer_stats_pkey" PRIMARY KEY ("clan_id","battle_id","player_id")
);

-- CreateTable
CREATE TABLE "action_codes" (
    "action_code" VARCHAR(20) NOT NULL,
    "display_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_codes_pkey" PRIMARY KEY ("action_code")
);

-- CreateTable
CREATE TABLE "monthly_clan_performance" (
    "clan_id" INTEGER NOT NULL,
    "month_id" VARCHAR(6) NOT NULL,
    "battle_count" INTEGER NOT NULL,
    "won_count" INTEGER NOT NULL,
    "lost_count" INTEGER NOT NULL,
    "tied_count" INTEGER NOT NULL,
    "month_complete" BOOLEAN NOT NULL DEFAULT false,
    "average_fp" DOUBLE PRECISION NOT NULL,
    "average_baseline_fp" DOUBLE PRECISION NOT NULL,
    "average_ratio" DOUBLE PRECISION NOT NULL,
    "average_margin_ratio" DOUBLE PRECISION NOT NULL,
    "average_fp_margin" DOUBLE PRECISION NOT NULL,
    "average_nonplaying_count" DOUBLE PRECISION NOT NULL,
    "average_nonplaying_fp_ratio" DOUBLE PRECISION NOT NULL,
    "average_reserve_count" DOUBLE PRECISION NOT NULL,
    "average_reserve_fp_ratio" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_clan_performance_pkey" PRIMARY KEY ("clan_id","month_id")
);

-- CreateTable
CREATE TABLE "monthly_individual_performance" (
    "clan_id" INTEGER NOT NULL,
    "month_id" VARCHAR(6) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "battles_played" INTEGER NOT NULL,
    "average_score" DOUBLE PRECISION NOT NULL,
    "average_fp" DOUBLE PRECISION NOT NULL,
    "average_ratio" DOUBLE PRECISION NOT NULL,
    "average_rank" DOUBLE PRECISION NOT NULL,
    "average_ratio_rank" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_individual_performance_pkey" PRIMARY KEY ("clan_id","month_id","player_id")
);

-- CreateTable
CREATE TABLE "yearly_clan_performance" (
    "clan_id" INTEGER NOT NULL,
    "year_id" VARCHAR(4) NOT NULL,
    "battle_count" INTEGER NOT NULL,
    "won_count" INTEGER NOT NULL,
    "lost_count" INTEGER NOT NULL,
    "tied_count" INTEGER NOT NULL,
    "year_complete" BOOLEAN NOT NULL DEFAULT false,
    "average_fp" DOUBLE PRECISION NOT NULL,
    "average_baseline_fp" DOUBLE PRECISION NOT NULL,
    "average_ratio" DOUBLE PRECISION NOT NULL,
    "average_margin_ratio" DOUBLE PRECISION NOT NULL,
    "average_fp_margin" DOUBLE PRECISION NOT NULL,
    "average_nonplaying_count" DOUBLE PRECISION NOT NULL,
    "average_nonplaying_fp_ratio" DOUBLE PRECISION NOT NULL,
    "average_reserve_count" DOUBLE PRECISION NOT NULL,
    "average_reserve_fp_ratio" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yearly_clan_performance_pkey" PRIMARY KEY ("clan_id","year_id")
);

-- CreateTable
CREATE TABLE "yearly_individual_performance" (
    "clan_id" INTEGER NOT NULL,
    "year_id" VARCHAR(4) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "battles_played" INTEGER NOT NULL,
    "average_score" DOUBLE PRECISION NOT NULL,
    "average_fp" DOUBLE PRECISION NOT NULL,
    "average_ratio" DOUBLE PRECISION NOT NULL,
    "average_rank" DOUBLE PRECISION NOT NULL,
    "average_ratio_rank" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yearly_individual_performance_pkey" PRIMARY KEY ("clan_id","year_id","player_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clans_rovio_id_key" ON "clans"("rovio_id");

-- CreateIndex
CREATE INDEX "idx_clan_rovio_id" ON "clans"("rovio_id");

-- CreateIndex
CREATE INDEX "idx_clan_active" ON "clans"("active");

-- CreateIndex
CREATE INDEX "idx_clan_name" ON "clans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_user_clan_id" ON "users"("clan_id");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_roster_clan_id" ON "roster_members"("clan_id");

-- CreateIndex
CREATE INDEX "idx_roster_active" ON "roster_members"("active");

-- CreateIndex
CREATE INDEX "idx_roster_player_name" ON "roster_members"("player_name");

-- CreateIndex
CREATE UNIQUE INDEX "roster_members_clan_id_player_name_key" ON "roster_members"("clan_id", "player_name");

-- CreateIndex
CREATE INDEX "idx_battle_clan_id" ON "clan_battles"("clan_id");

-- CreateIndex
CREATE INDEX "idx_battle_id" ON "clan_battles"("battle_id");

-- CreateIndex
CREATE INDEX "idx_battle_start_date" ON "clan_battles"("start_date");

-- CreateIndex
CREATE INDEX "idx_player_stats_battle" ON "clan_battle_player_stats"("clan_id", "battle_id");

-- CreateIndex
CREATE INDEX "idx_player_stats_player" ON "clan_battle_player_stats"("player_id");

-- CreateIndex
CREATE INDEX "idx_player_stats_ratio" ON "clan_battle_player_stats"("ratio");

-- CreateIndex
CREATE INDEX "idx_nonplayer_stats_battle" ON "clan_battle_nonplayer_stats"("clan_id", "battle_id");

-- CreateIndex
CREATE INDEX "idx_nonplayer_stats_player" ON "clan_battle_nonplayer_stats"("player_id");

-- CreateIndex
CREATE INDEX "idx_nonplayer_stats_reserve" ON "clan_battle_nonplayer_stats"("reserve");

-- CreateIndex
CREATE INDEX "idx_monthly_clan_month" ON "monthly_clan_performance"("month_id");

-- CreateIndex
CREATE INDEX "idx_monthly_individual_month" ON "monthly_individual_performance"("month_id");

-- CreateIndex
CREATE INDEX "idx_monthly_individual_player" ON "monthly_individual_performance"("player_id");

-- CreateIndex
CREATE INDEX "idx_yearly_clan_year" ON "yearly_clan_performance"("year_id");

-- CreateIndex
CREATE INDEX "idx_yearly_individual_year" ON "yearly_individual_performance"("year_id");

-- CreateIndex
CREATE INDEX "idx_yearly_individual_player" ON "yearly_individual_performance"("player_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_members" ADD CONSTRAINT "roster_members_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battles" ADD CONSTRAINT "clan_battles_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battle_player_stats" ADD CONSTRAINT "clan_battle_player_stats_clan_id_battle_id_fkey" FOREIGN KEY ("clan_id", "battle_id") REFERENCES "clan_battles"("clan_id", "battle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battle_player_stats" ADD CONSTRAINT "clan_battle_player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "roster_members"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battle_player_stats" ADD CONSTRAINT "clan_battle_player_stats_action_code_fkey" FOREIGN KEY ("action_code") REFERENCES "action_codes"("action_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battle_nonplayer_stats" ADD CONSTRAINT "clan_battle_nonplayer_stats_clan_id_battle_id_fkey" FOREIGN KEY ("clan_id", "battle_id") REFERENCES "clan_battles"("clan_id", "battle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battle_nonplayer_stats" ADD CONSTRAINT "clan_battle_nonplayer_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "roster_members"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_battle_nonplayer_stats" ADD CONSTRAINT "clan_battle_nonplayer_stats_action_code_fkey" FOREIGN KEY ("action_code") REFERENCES "action_codes"("action_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_clan_performance" ADD CONSTRAINT "monthly_clan_performance_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_individual_performance" ADD CONSTRAINT "monthly_individual_performance_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_individual_performance" ADD CONSTRAINT "monthly_individual_performance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "roster_members"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearly_clan_performance" ADD CONSTRAINT "yearly_clan_performance_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearly_individual_performance" ADD CONSTRAINT "yearly_individual_performance_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("clan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearly_individual_performance" ADD CONSTRAINT "yearly_individual_performance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "roster_members"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
