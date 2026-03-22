-- CreateTable
CREATE TABLE "places" (
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formatted_address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "google_rating" DOUBLE PRECISION,
    "google_user_ratings_total" INTEGER,
    "types" TEXT[],
    "phone_number" TEXT,
    "website" TEXT,
    "last_google_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("place_id")
);

-- CreateTable
CREATE TABLE "features" (
    "feature_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "value_type" TEXT NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("feature_key")
);

-- CreateTable
CREATE TABLE "place_features" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "value_boolean" BOOLEAN,
    "value_text" TEXT,
    "score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "source_summary" TEXT,

    CONSTRAINT "place_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_keywords" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "normalized_keyword" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_targets" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "last_crawled_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_runs" (
    "id" TEXT NOT NULL,
    "crawl_target_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "status_message" TEXT,

    CONSTRAINT "crawl_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_contents" (
    "id" TEXT NOT NULL,
    "crawl_run_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "raw_content" TEXT,
    "text_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_features_feature_key_place_id_idx" ON "place_features"("feature_key", "place_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_features_place_id_feature_key_key" ON "place_features"("place_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_keywords_user_id_normalized_keyword_key" ON "user_keywords"("user_id", "normalized_keyword");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_place_id_key" ON "favorites"("user_id", "place_id");

-- CreateIndex
CREATE UNIQUE INDEX "crawl_targets_url_key" ON "crawl_targets"("url");

-- AddForeignKey
ALTER TABLE "place_features" ADD CONSTRAINT "place_features_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("place_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_features" ADD CONSTRAINT "place_features_feature_key_fkey" FOREIGN KEY ("feature_key") REFERENCES "features"("feature_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_keywords" ADD CONSTRAINT "user_keywords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("place_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_targets" ADD CONSTRAINT "crawl_targets_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("place_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_crawl_target_id_fkey" FOREIGN KEY ("crawl_target_id") REFERENCES "crawl_targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_contents" ADD CONSTRAINT "crawl_contents_crawl_run_id_fkey" FOREIGN KEY ("crawl_run_id") REFERENCES "crawl_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
