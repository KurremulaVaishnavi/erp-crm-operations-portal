import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import prisma from './prisma/client';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import challanRoutes from './routes/challan.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// App API routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/stock-movements', stockRoutes);
app.use('/challans', challanRoutes);
app.use('/dashboard', dashboardRoutes);

// Error handler middleware
app.use(errorHandler);

// Function to seed default admin user and mock dashboard data
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@erpcrm.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Super Admin',
          role: 'ADMIN',
        },
      });
      console.log(`[Seed] Created default administrator account: ${adminEmail}`);
    }

    // Seed mock data only if database is completely empty of products/customers
    const productCount = await prisma.product.count();
    const customerCount = await prisma.customer.count();

    if (productCount === 0 && customerCount === 0) {
      console.log('[Seed] Populating mock databases for ERP + CRM dashboards...');

      // 1. Seed Products
      const prod1 = await prisma.product.create({
        data: {
          productName: 'Premium Copper Wire Spool',
          sku: 'COP-WIRE-001',
          category: 'Electricals',
          unitPrice: 85.50,
          currentStock: 120,
          minimumStockAlert: 20,
          warehouseLocation: 'Aisle A-3',
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
          warehouseLocation: 'Aisle B-1',
        }
      });

      const prod3 = await prisma.product.create({
        data: {
          productName: 'Fiber Optic Connector Kit',
          sku: 'FIB-CONN-909',
          category: 'Telecom',
          unitPrice: 45.00,
          currentStock: 3, // Trigger Low Stock Warning
          minimumStockAlert: 10,
          warehouseLocation: 'Aisle C-2',
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
          warehouseLocation: 'Aisle A-5',
        }
      });

      // Log initial stock setup movements
      const movements = [prod1, prod2, prod3, prod4].map(p => ({
        productId: p.id,
        quantityChanged: p.currentStock,
        movementType: 'IN',
        reason: 'Initial stock load',
        createdById: admin!.id,
      }));

      await prisma.stockMovement.createMany({ data: movements });

      // 2. Seed Customers
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
          notes: 'Prefers bulk wire spool shipments.',
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
          notes: 'Deliveries to seaport branch.',
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
          notes: 'Requested product catalogs.',
        }
      });

      // 3. Seed Follow-Ups
      await prisma.customerFollowUp.createMany({
        data: [
          { customerId: cust1.id, note: 'Discussed wholesale discounts for copper wire wire kits.' },
          { customerId: cust3.id, note: 'Called lead to setup introduction presentation.' },
        ]
      });

      // 4. Seed Sales Challans (One Confirmed, One Draft)
      const challan1 = await prisma.challan.create({
        data: {
          challanNumber: 'CH-20260722-1011',
          customerId: cust1.id,
          createdById: admin!.id,
          status: 'CONFIRMED',
        }
      });

      await prisma.challanItem.create({
        data: {
          challanId: challan1.id,
          productId: prod1.id,
          quantity: 10,
          priceSnapshot: prod1.unitPrice,
          productNameSnapshot: prod1.productName,
        }
      });

      // Update confirmed challan physical stock and log stock movement
      await prisma.product.update({
        where: { id: prod1.id },
        data: { currentStock: { decrement: 10 } },
      });

      await prisma.stockMovement.create({
        data: {
          productId: prod1.id,
          quantityChanged: 10,
          movementType: 'OUT',
          reason: `Sales Challan ${challan1.challanNumber} Confirmed`,
          createdById: admin!.id,
        }
      });

      const challan2 = await prisma.challan.create({
        data: {
          challanNumber: 'CH-20260722-2022',
          customerId: cust2.id,
          createdById: admin!.id,
          status: 'DRAFT',
        }
      });

      await prisma.challanItem.createMany({
        data: [
          {
            challanId: challan2.id,
            productId: prod2.id,
            quantity: 5,
            priceSnapshot: prod2.unitPrice,
            productNameSnapshot: prod2.productName,
          },
          {
            challanId: challan2.id,
            productId: prod4.id,
            quantity: 2,
            priceSnapshot: prod4.unitPrice,
            productNameSnapshot: prod4.productName,
          }
        ]
      });

      console.log('[Seed] Database successfully seeded with dashboard analytics!');
    }
  } catch (error) {
    console.error('[Seed] Error seeding databases:', error);
  }
};

const server = app.listen(PORT, async () => {
  console.log(`[Server] Mini ERP + CRM service running on port ${PORT}`);
  await seedDefaultAdmin();
});

export default app;
