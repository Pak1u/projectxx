/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `Offer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "acceptedAt";

-- CreateTable
CREATE TABLE "VendorWarehouseRequest" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorWarehouseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorWarehouseRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "volume" INTEGER NOT NULL,

    CONSTRAINT "VendorWarehouseRequestItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VendorWarehouseRequest" ADD CONSTRAINT "VendorWarehouseRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorWarehouseRequest" ADD CONSTRAINT "VendorWarehouseRequest_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorWarehouseRequestItem" ADD CONSTRAINT "VendorWarehouseRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorWarehouseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
