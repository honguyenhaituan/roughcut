-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Article_publicId_key" ON "Article"("publicId");

