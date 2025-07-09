/*
  Warnings:

  - A unique constraint covering the columns `[warehouseId,itemName]` on the table `WarehouseInventory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WarehouseInventory_warehouseId_itemName_key" ON "WarehouseInventory"("warehouseId", "itemName");
