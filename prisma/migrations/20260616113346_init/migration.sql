/*
  Warnings:

  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "admissionNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TEXT DEFAULT '2010-01-01',
    "schoolLevel" TEXT DEFAULT 'PRIMARY',
    "classId" TEXT,
    "streamId" TEXT,
    "academicYear" TEXT DEFAULT '2026',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrollmentDate" TEXT,
    "parentGuardianName" TEXT DEFAULT 'To be assigned',
    "parentGuardianPhone" TEXT DEFAULT 'N/A',
    "alternativeContact" TEXT,
    "residentialAddress" TEXT DEFAULT 'N/A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("academicYear", "admissionNumber", "alternativeContact", "classId", "dateOfBirth", "enrollmentDate", "firstName", "gender", "id", "lastName", "parentGuardianName", "parentGuardianPhone", "residentialAddress", "schoolLevel", "status", "streamId", "userId") SELECT "academicYear", "admissionNumber", "alternativeContact", "classId", "dateOfBirth", "enrollmentDate", "firstName", "gender", "id", "lastName", "parentGuardianName", "parentGuardianPhone", "residentialAddress", "schoolLevel", "status", "streamId", "userId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");
CREATE INDEX "Student_classId_idx" ON "Student"("classId");
CREATE INDEX "Student_streamId_idx" ON "Student"("streamId");
CREATE INDEX "Student_status_idx" ON "Student"("status");
CREATE INDEX "Student_academicYear_idx" ON "Student"("academicYear");
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
