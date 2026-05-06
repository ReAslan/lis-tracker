/*
  Warnings:

  - Added the required column `readerId` to the `CreativeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `readerId` to the `Work` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Reader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🍑',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CreativeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreativeEntry_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CreativeEntry" ("content", "createdAt", "id", "title", "updatedAt") SELECT "content", "createdAt", "id", "title", "updatedAt" FROM "CreativeEntry";
DROP TABLE "CreativeEntry";
ALTER TABLE "new_CreativeEntry" RENAME TO "CreativeEntry";
CREATE TABLE "new_Work" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "type" TEXT NOT NULL,
    "serialStatus" TEXT NOT NULL,
    "coverUrl" TEXT,
    "readingStatus" TEXT NOT NULL DEFAULT 'reading',
    "progressCurrent" INTEGER NOT NULL DEFAULT 0,
    "progressTotal" INTEGER,
    "rating" INTEGER,
    "oneLineReview" TEXT,
    "touchingMoments" TEXT,
    "daysToFinish" INTEGER,
    "cpPersonality" TEXT,
    "cpTension" TEXT,
    "cpFamousLines" TEXT,
    "tags" TEXT,
    "tropes" TEXT,
    "notes" TEXT,
    "readerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Work_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Work" ("author", "coverUrl", "cpFamousLines", "cpPersonality", "cpTension", "createdAt", "daysToFinish", "id", "notes", "oneLineReview", "progressCurrent", "progressTotal", "rating", "readingStatus", "serialStatus", "tags", "title", "touchingMoments", "tropes", "type", "updatedAt") SELECT "author", "coverUrl", "cpFamousLines", "cpPersonality", "cpTension", "createdAt", "daysToFinish", "id", "notes", "oneLineReview", "progressCurrent", "progressTotal", "rating", "readingStatus", "serialStatus", "tags", "title", "touchingMoments", "tropes", "type", "updatedAt" FROM "Work";
DROP TABLE "Work";
ALTER TABLE "new_Work" RENAME TO "Work";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
