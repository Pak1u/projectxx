-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_vendorId_employeeId_key" ON "Assignment"("vendorId", "employeeId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
