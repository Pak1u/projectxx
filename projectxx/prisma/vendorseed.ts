import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Replace with your actual vendor ID
 
  const vendorId = 'cmd2x14yn0007nf0oyay22y6q';

  const items = [
    { itemName: "Toilet Paper", quantity: 150, price: 165.82 },
    { itemName: "Detergent", quantity: 85, price: 422.58 },
    { itemName: "Shampoo", quantity: 130, price: 163.43 },
    { itemName: "Hand Sanitizer", quantity: 70, price: 465.45 },
    { itemName: "Face Wash", quantity: 90, price: 325.81 },
    { itemName: "Hair Oil", quantity: 100, price: 434.07 },
    { itemName: "Toothpaste", quantity: 140, price: 54.92 },
    { itemName: "Bottled Water", quantity: 200, price: 141.31 },
    { itemName: "Biscuits", quantity: 180, price: 293.28 },
    { itemName: "Tea", quantity: 120, price: 462.89 },
    { itemName: "Sugar", quantity: 160, price: 180.06 },
    { itemName: "Salt", quantity: 170, price: 401.08 },
    { itemName: "Soap", quantity: 150, price: 178.97 },
    { itemName: "Milk", quantity: 190, price: 105.95 },
    { itemName: "Cheese", quantity: 80, price: 431.11 },
    { itemName: "Butter", quantity: 75, price: 439.24 },
    { itemName: "Paneer", quantity: 60, price: 72.2 },
    { itemName: "Laundry Liquid", quantity: 90, price: 251.2 },
    { itemName: "Dishwash Gel", quantity: 110, price: 72.54 },
    { itemName: "Chips", quantity: 140, price: 434.23 },
    { itemName: "Chocolate", quantity: 130, price: 325.74 },
    { itemName: "Coffee", quantity: 100, price: 447.29 },
    { itemName: "Green Tea", quantity: 80, price: 195.21 },
    { itemName: "Juice", quantity: 90, price: 396.85 },
    { itemName: "Soft Drink", quantity: 100, price: 234.54 },
    { itemName: "Dry Fruits", quantity: 70, price: 105.29 },
    { itemName: "Honey", quantity: 60, price: 477.57 },
    { itemName: "Bread", quantity: 180, price: 145.8 },
    { itemName: "Eggs", quantity: 150, price: 436.36 },
    { itemName: "Cereal", quantity: 110, price: 486.03 },
    { itemName: "Oats", quantity: 120, price: 74.96 },
    { itemName: "Baby Food", quantity: 60, price: 216.45 },
    { itemName: "Tissues", quantity: 130, price: 454.16 }
  ];

  // If you want to store price, make sure VendorInventory has a price field in your schema!
  await prisma.vendorInventory.createMany({
    data: items.map(item => ({
      vendorId,
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  console.log('Sample vendor inventory seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });