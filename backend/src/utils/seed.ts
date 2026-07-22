import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Force-resetting and seeding local SQLite database...');

  // Delete all existing data to prevent primary key or unique constraints collisions
  await prisma.challanItem.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.customerFollowUp.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('[Seed] Cleaned old database records.');

  // 1. Create Default Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@erpcrm.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  // 2. Create Warehouse User
  const warehousePass = await bcrypt.hash('warehouse123', 10);
  const warehouseStaff = await prisma.user.create({
    data: {
      email: 'warehouse@erpcrm.com',
      password: warehousePass,
      name: 'John Warehouse',
      role: 'WAREHOUSES',
    },
  });

  // 3. Create Sales User
  const salesPass = await bcrypt.hash('sales123', 10);
  const salesStaff = await prisma.user.create({
    data: {
      email: 'sales@erpcrm.com',
      password: salesPass,
      name: 'Sarah Sales',
      role: 'SALES',
    },
  });

  // 4. Create Accounts User
  const accountsPass = await bcrypt.hash('accounts123', 10);
  const accountsStaff = await prisma.user.create({
    data: {
      email: 'accounts@erpcrm.com',
      password: accountsPass,
      name: 'Adam Accounts',
      role: 'ACCOUNTS',
    },
  });

  console.log('[Seed] Users seeded successfully.');

  // 4. Create Customers (CRM Leads/Clients)
  const cust1 = await prisma.customer.create({
    data: {
      customerName: 'Apex Electrical Solutions',
      mobileNumber: '9876543210',
      email: 'contact@apex.com',
      businessName: 'Apex Electrics Ltd',
      gstNumber: '22AAAAA1111A1Z1',
      customerType: 'WHOLESALE',
      address: '102 Industrial Hub, Sector 4, Metro City',
      status: 'ACTIVE',
      notes: 'Prefers bulk copper spool shipments.',
    }
  });

  const cust2 = await prisma.customer.create({
    data: {
      customerName: 'Global Supply Logistics',
      mobileNumber: '8765432109',
      email: 'info@globalsupply.com',
      businessName: 'Global Supply Inc',
      gstNumber: '22BBBBB2222B1Z2',
      customerType: 'DISTRIBUTOR',
      address: 'Central Warehouse D, Port Area',
      status: 'ACTIVE',
      notes: 'Deliveries to seaport branch directly.',
    }
  });

  const cust3 = await prisma.customer.create({
    data: {
      customerName: 'Metro Retail Outlets',
      mobileNumber: '7654321098',
      email: 'purchase@metroretail.in',
      businessName: 'Metro Retailers',
      gstNumber: null,
      customerType: 'RETAIL',
      address: '44 High Street Mall, Sector 2',
      status: 'LEAD',
      notes: 'Requested product catalogs for tools segment.',
    }
  });

  const cust4 = await prisma.customer.create({
    data: {
      customerName: 'Aone Hardware Spares',
      mobileNumber: '6543210987',
      email: 'orders@aonehardware.com',
      businessName: 'Aone Spares Corp',
      gstNumber: '22CCCCC3333C1Z3',
      customerType: 'WHOLESALE',
      address: 'Shop No 12, Industrial Market Lane',
      status: 'INACTIVE',
      notes: 'No orders since last quarter.',
    }
  });

  console.log('[Seed] Customers CRM Directory seeded successfully.');

  // 5. Create Customer Follow-Up Notes
  await prisma.customerFollowUp.createMany({
    data: [
      { customerId: cust1.id, note: 'Discussed wholesale discounts for copper wire spools. Quote sent.' },
      { customerId: cust1.id, note: 'Apex confirmed order details and requested draft challan.' },
      { customerId: cust3.id, note: 'Called lead to schedule introduction video meeting next Monday.' },
    ]
  });

  console.log('[Seed] Customer Follow-ups seeded.');

  // 6. Create Products (Inventory catalog)
  const prod1 = await prisma.product.create({
    data: {
      productName: 'Premium Copper Spool 10m',
      sku: 'COP-SPOOL-10M',
      category: 'Electricals',
      unitPrice: 85.50,
      currentStock: 120,
      minimumStockAlert: 20,
      warehouseLocation: 'Aisle A, Bin 3',
    }
  });

  const prod2 = await prisma.product.create({
    data: {
      productName: 'Industrial Steel Pipes (Set of 10)',
      sku: 'STL-PIPE-102',
      category: 'Hardware',
      unitPrice: 240.00,
      currentStock: 15,
      minimumStockAlert: 5,
      warehouseLocation: 'Aisle B, Bin 1',
    }
  });

  const prod3 = await prisma.product.create({
    data: {
      productName: 'Fiber Optic Connector Kit',
      sku: 'FIB-CONN-909',
      category: 'Telecom',
      unitPrice: 45.00,
      currentStock: 3, // Lower than alert threshold
      minimumStockAlert: 10,
      warehouseLocation: 'Aisle C, Bin 2',
    }
  });

  const prod4 = await prisma.product.create({
    data: {
      productName: 'Heavy Duty Power Drill',
      sku: 'PWR-DRL-404',
      category: 'Tools',
      unitPrice: 120.00,
      currentStock: 50,
      minimumStockAlert: 15,
      warehouseLocation: 'Aisle A, Bin 5',
    }
  });

  const prod5 = await prisma.product.create({
    data: {
      productName: 'Heavy Duty extension cord 50m',
      sku: 'EXT-CORD-50M',
      category: 'Electricals',
      unitPrice: 28.99,
      currentStock: 80,
      minimumStockAlert: 10,
      warehouseLocation: 'Aisle A, Bin 12',
    }
  });

  console.log('[Seed] Inventory Products seeded successfully.');

  // 7. Seed Stock Movements (Auditing Trail)
  await prisma.stockMovement.createMany({
    data: [
      { productId: prod1.id, quantityChanged: 150, movementType: 'IN', reason: 'Bulk import receipt', createdById: warehouseStaff.id },
      { productId: prod2.id, quantityChanged: 20, movementType: 'IN', reason: 'Initial load', createdById: warehouseStaff.id },
      { productId: prod3.id, quantityChanged: 10, movementType: 'IN', reason: 'Import load', createdById: warehouseStaff.id },
      { productId: prod4.id, quantityChanged: 50, movementType: 'IN', reason: 'Stock load', createdById: warehouseStaff.id },
      { productId: prod5.id, quantityChanged: 80, movementType: 'IN', reason: 'Stock load', createdById: warehouseStaff.id },
      // Outward movements
      { productId: prod1.id, quantityChanged: 20, movementType: 'OUT', reason: 'Manual audit correction', createdById: warehouseStaff.id },
      { productId: prod3.id, quantityChanged: 7, movementType: 'OUT', reason: 'Damaged goods write off', createdById: warehouseStaff.id },
    ]
  });

  // Adjust stocks to match movements audit
  await prisma.product.update({ where: { id: prod1.id }, data: { currentStock: 130 } });
  await prisma.product.update({ where: { id: prod3.id }, data: { currentStock: 3 } });

  console.log('[Seed] Stock Movements audit logged.');

  // 8. Seed Sales Challans
  // Challan 1: Confirmed
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260722-1001',
      customerId: cust1.id,
      createdById: salesStaff.id,
      status: 'CONFIRMED',
    }
  });

  await prisma.challanItem.createMany({
    data: [
      { challanId: challan1.id, productId: prod1.id, quantity: 10, priceSnapshot: prod1.unitPrice, productNameSnapshot: prod1.productName },
      { challanId: challan1.id, productId: prod4.id, quantity: 2, priceSnapshot: prod4.unitPrice, productNameSnapshot: prod4.productName },
    ]
  });

  // Update physical stock for Confirmed Challan
  await prisma.product.update({ where: { id: prod1.id }, data: { currentStock: { decrement: 10 } } });
  await prisma.product.update({ where: { id: prod4.id }, data: { currentStock: { decrement: 2 } } });

  // Log stock movements for Confirmed Challan
  await prisma.stockMovement.createMany({
    data: [
      { productId: prod1.id, quantityChanged: 10, movementType: 'OUT', reason: `Sales Challan ${challan1.challanNumber} Confirmed`, createdById: salesStaff.id },
      { productId: prod4.id, quantityChanged: 2, movementType: 'OUT', reason: `Sales Challan ${challan1.challanNumber} Confirmed`, createdById: salesStaff.id },
    ]
  });

  // Challan 2: Draft
  const challan2 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260722-2002',
      customerId: cust2.id,
      createdById: salesStaff.id,
      status: 'DRAFT',
    }
  });

  await prisma.challanItem.createMany({
    data: [
      { challanId: challan2.id, productId: prod2.id, quantity: 5, priceSnapshot: prod2.unitPrice, productNameSnapshot: prod2.productName },
      { challanId: challan2.id, productId: prod5.id, quantity: 10, priceSnapshot: prod5.unitPrice, productNameSnapshot: prod5.productName },
    ]
  });

  // Challan 3: Cancelled
  const challan3 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260722-3003',
      customerId: cust1.id,
      createdById: salesStaff.id,
      status: 'CANCELLED',
    }
  });

  await prisma.challanItem.create({
    data: {
      challanId: challan3.id,
      productId: prod4.id,
      quantity: 1,
      priceSnapshot: prod4.unitPrice,
      productNameSnapshot: prod4.productName,
    }
  });

  console.log('[Seed] Sales Challans and items seeded successfully.');
  console.log('[Seed] Database successfully populated! Ready for inspection.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
