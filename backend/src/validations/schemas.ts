import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    role: z.enum(['ADMIN', 'SALES', 'WAREHOUSES', 'ACCOUNTS']),
  }),
});

export const customerSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Customer name is required'),
    mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
    email: z.string().email('Invalid email address'),
    businessName: z.string().min(2, 'Business name is required'),
    gstNumber: z.string().optional().nullable(),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
    followUpDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    notes: z.string().optional().nullable(),
  }),
});

export const customerUpdateSchema = z.object({
  body: customerSchema.shape.body.partial(),
});

export const customerFollowUpSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note cannot be empty'),
  }),
});

export const productSchema = z.object({
  body: z.object({
    productName: z.string().min(2, 'Product name is required'),
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.number().positive('Price must be greater than zero'),
    currentStock: z.number().int().nonnegative('Stock cannot be negative').default(0),
    minimumStockAlert: z.number().int().nonnegative('Minimum stock alert cannot be negative').default(5),
    warehouseLocation: z.string().min(2, 'Warehouse location is required'),
  }),
});

export const productUpdateSchema = z.object({
  body: productSchema.shape.body.partial(),
});

export const stockMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid Product ID'),
    quantityChanged: z.number().int().positive('Quantity changed must be a positive integer'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().min(2, 'Reason is required'),
  }),
});

export const challanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid Customer ID'),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid Product ID'),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
      })
    ).min(1, 'Challan must contain at least one item'),
  }),
});

export const updateChallanStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
  }),
});
