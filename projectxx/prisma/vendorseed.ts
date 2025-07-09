import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Replace with your actual vendor ID
 
  const vendorId = 'cmcv1v3oe000bnf9c5y770o1a';

  const items = [
    { itemName: "Toilet Paper", quantity: 150, price: 165.82 },
    { itemName: "Detergent", quantity: 85, price: 422.58 },
    { itemName: "Shampoo", quantity: 130, price: 163.43 },
    { itemName: "Hand Sanitizer", quantity: 70, price: 465.45 },
    { itemName: "Face Wash", quantity: 90, price: 325.81 },
    { itemName: "Hair Oil", quantity: 100, price: 434.07 },
    { itemName: "Toothpaste", quantity: 140, price: 54.92 }
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