import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Replace with your actual warehouse ID
  const warehouseId = 'cmcv1tkzo0007nf9cp0g7ts82';

  const items = [
    { itemName: "Rice", quantity: 20, price: 466.22 },
    { itemName: "Wheat Flour", quantity: 15, price: 156.03 },
    { itemName: "Cooking Oil", quantity: 25, price: 337.57 },
    { itemName: "Tea", quantity: 10, price: 462.89 },
    { itemName: "Sugar", quantity: 20, price: 180.06 },
    { itemName: "Salt", quantity: 25, price: 401.08 },
    { itemName: "Milk", quantity: 40, price: 105.95 },
    { itemName: "Toilet Paper", quantity: 30, price: 165.82 },
    { itemName: "Detergent", quantity: 15, price: 422.58 },
    { itemName: "Shampoo", quantity: 25, price: 163.43 },
    { itemName: "Hand Sanitizer", quantity: 15, price: 465.45 },
    { itemName: "Face Wash", quantity: 20, price: 325.81 },
    { itemName: "Hair Oil", quantity: 25, price: 434.07 },
    { itemName: "Toothpaste", quantity: 30, price: 54.92 },
    { itemName: "Noodles", quantity: 20, price: 297.52 },
    { itemName: "Biscuits", quantity: 25, price: 293.28 },
    { itemName: "Chips", quantity: 20, price: 434.23 },
    { itemName: "Chocolate", quantity: 25, price: 325.74 },
    { itemName: "Coffee", quantity: 15, price: 447.29 },
    { itemName: "Juice", quantity: 20, price: 396.85 },
    { itemName: "Soft Drink", quantity: 30, price: 234.54 },
    { itemName: "Bottled Water", quantity: 60, price: 141.31 },
    { itemName: "Laundry Liquid", quantity: 15, price: 251.2 },
    { itemName: "Floor Cleaner", quantity: 10, price: 316.61 },
    { itemName: "Mop", quantity: 10, price: 295.57 },
    { itemName: "Bleach", quantity: 15, price: 128.1 },
    { itemName: "Mosquito Spray", quantity: 15, price: 248.07 },
    { itemName: "Room Freshener", quantity: 20, price: 212.1 }
  ];

  await prisma.warehouseInventory.createMany({
    data: items.map(item => ({
      warehouseId,
      itemName: item.itemName,
      quantity: item.quantity,
      // price: item.price,
    })),
  });

  // If you want to store price, add a price field to WarehouseInventory in your schema and migrate!
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });