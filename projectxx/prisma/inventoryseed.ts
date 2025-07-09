import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const items = [
    { name: "Rice", price: 466.22 },
    { name: "Wheat Flour", price: 156.03 },
    { name: "Cooking Oil", price: 337.57 },
    { name: "Toilet Paper", price: 165.82 },
    { name: "Detergent", price: 422.58 },
    { name: "Shampoo", price: 163.43 },
    { name: "Noodles", price: 297.52 },
    { name: "Biscuits", price: 293.28 },
    { name: "Bottled Water", price: 141.31 },
    { name: "Tea", price: 462.89 },
    { name: "Sugar", price: 180.06 },
    { name: "Salt", price: 401.08 },
    { name: "Soap", price: 178.97 },
    { name: "Toothpaste", price: 54.92 },
    { name: "Milk", price: 105.95 },
    { name: "Cheese", price: 431.11 },
    { name: "Butter", price: 439.24 },
    { name: "Paneer", price: 72.2 },
    { name: "Face Wash", price: 325.81 },
    { name: "Hair Oil", price: 434.07 },
    { name: "Hand Sanitizer", price: 465.45 },
    { name: "Laundry Liquid", price: 251.2 },
    { name: "Dishwash Gel", price: 72.54 },
    { name: "Chips", price: 434.23 },
    { name: "Chocolate", price: 325.74 },
    { name: "Coffee", price: 447.29 },
    { name: "Green Tea", price: 195.21 },
    { name: "Juice", price: 396.85 },
    { name: "Soft Drink", price: 234.54 },
    { name: "Dry Fruits", price: 105.29 },
    { name: "Honey", price: 477.57 },
    { name: "Ketchup", price: 376.95 },
    { name: "Mustard", price: 316.55 },
    { name: "Vinegar", price: 411.7 },
    { name: "Pickle", price: 480.89 },
    { name: "Jam", price: 483.78 },
    { name: "Bread", price: 145.8 },
    { name: "Eggs", price: 436.36 },
    { name: "Cereal", price: 486.03 },
    { name: "Oats", price: 74.96 },
    { name: "Baby Food", price: 216.45 },
    { name: "Tissues", price: 454.16 },
    { name: "Garbage Bags", price: 256.05 },
    { name: "Mop", price: 295.57 },
    { name: "Broom", price: 392.43 },
    { name: "Floor Cleaner", price: 316.61 },
    { name: "Room Freshener", price: 212.1 },
    { name: "Mosquito Spray", price: 248.07 },
    { name: "Bleach", price: 128.1 },
    { name: "Matches", price: 300.58 },
    { name: "Candles", price: 436.66 }
  ];
  await prisma.inventoryItem.createMany({ data: items });
  console.log('Seeded inventory catalog!');
}

main().finally(() => prisma.$disconnect());