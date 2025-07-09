-- CreateTable
CREATE TABLE "WarehouseLog" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "signinTime" TIMESTAMP(3) NOT NULL,
    "signoutTime" TIMESTAMP(3),

    CONSTRAINT "WarehouseLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WarehouseLog" ADD CONSTRAINT "WarehouseLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLog" ADD CONSTRAINT "WarehouseLog_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
