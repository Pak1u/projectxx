/*
  Warnings:

  - The primary key for the `InventoryItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `volume` on the `InventoryItem` table. All the data in the column will be lost.
  - The `id` column on the `InventoryItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `volume` on the `VendorInventory` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `WarehouseInventory` table. All the data in the column will be lost.
  - You are about to drop the `VendorWarehouseRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorWarehouseRequestItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VendorWarehouseRequest" DROP CONSTRAINT "VendorWarehouseRequest_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "VendorWarehouseRequest" DROP CONSTRAINT "VendorWarehouseRequest_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "VendorWarehouseRequestItem" DROP CONSTRAINT "VendorWarehouseRequestItem_requestId_fkey";

-- AlterTable
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_pkey",
DROP COLUMN "volume",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "VendorInventory" DROP COLUMN "volume";

-- AlterTable
ALTER TABLE "WarehouseInventory" DROP COLUMN "volume";

-- DropTable
DROP TABLE "VendorWarehouseRequest";

-- DropTable
DROP TABLE "VendorWarehouseRequestItem";
