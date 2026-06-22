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
    "dateOfBirth" TEXT NOT NULL,
    "schoolLevel" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "streamId" TEXT,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrollmentDate" TEXT NOT NULL,
    "parentGuardianName" TEXT NOT NULL,
    "parentGuardianPhone" TEXT NOT NULL,
    "alternativeContact" TEXT,
    "residentialAddress" TEXT NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("academicYear", "admissionNumber", "alternativeContact", "classId", "dateOfBirth", "enrollmentDate", "firstName", "gender", "id", "lastName", "parentGuardianName", "parentGuardianPhone", "residentialAddress", "schoolLevel", "status", "streamId", "userId") SELECT "academicYear", "admissionNumber", "alternativeContact", "classId", "dateOfBirth", "enrollmentDate", "firstName", "gender", "id", "lastName", "parentGuardianName", "parentGuardianPhone", "residentialAddress", "schoolLevel", "status", "streamId", "userId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
