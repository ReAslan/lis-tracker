-- CreateTable
CREATE TABLE "Work" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreativeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
