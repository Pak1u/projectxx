/*
  Warnings:

  - Added the required column `volume` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volume` to the `VendorInventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volume` to the `WarehouseInventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "volume" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "VendorInventory" ADD COLUMN     "volume" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "WarehouseInventory" ADD COLUMN     "volume" INTEGER NOT NULL;
