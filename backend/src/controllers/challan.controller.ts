import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';


export const getChallans = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const challans = await prisma.challan.findMany({
      orderBy: { createdDate: 'desc' },
      include: {
        customer: {
          select: { customerName: true, businessName: true },
        },
        createdBy: {
          select: { name: true },
        },
        items: true,
      },
    });

    res.status(200).json({
      success: true,
      challans,
    });
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { name: true, email: true },
        },
        items: true,
      },
    });

    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    res.status(200).json({
      success: true,
      challan,
    });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId, items } = req.body; // items: Array of { productId, quantity }

    if (!req.user) {
      throw new AppError('User session not found', 401);
    }

    // Auto generate unique challan number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const challanNumber = `CH-${dateStr}-${rand}`;

    const newChallan = await prisma.$transaction(async (tx) => {
      // Gather product details for snapshot
      const productIds = items.map((item: any) => item.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (dbProducts.length !== items.length) {
        throw new Error('One or more products in the list are invalid');
      }

      // Create Challan
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          createdById: req.user!.id,
          status: 'DRAFT',
        },
      });

      // Create ChallanItems with snapshots
      const challanItemsData = items.map((item: any) => {
        const prod = dbProducts.find((p) => p.id === item.productId)!;
        return {
          challanId: challan.id,
          productId: prod.id,
          quantity: item.quantity,
          priceSnapshot: prod.unitPrice,
          productNameSnapshot: prod.productName,
        };
      });

      await tx.challanItem.createMany({
        data: challanItemsData,
      });

      return challan;
    });

    const fullChallan = await prisma.challan.findUnique({
      where: { id: newChallan.id },
      include: { items: true },
    });

    res.status(201).json({
      success: true,
      challan: fullChallan,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Error creating challan', 400));
  }
};

export const updateChallanStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // DRAFT, CONFIRMED, CANCELLED

    if (!req.user) {
      throw new AppError('User session not found', 401);
    }

    const currentChallan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentChallan) {
      throw new AppError('Challan not found', 404);
    }

    if (currentChallan.status === status) {
      return res.status(200).json({ success: true, challan: currentChallan });
    }

    // Logic for confirmed/cancelled transitions
    const updatedChallan = await prisma.$transaction(async (tx) => {
      // 1. DRAFT -> CONFIRMED: Reduce stock
      if (status === 'CONFIRMED') {
        for (const item of currentChallan.items) {
          if (!item.productId) {
            throw new Error(`Product reference missing for snapshot name: ${item.productNameSnapshot}`);
          }
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new Error(`Product ${item.productNameSnapshot} not found`);
          }

          if (product.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.productName}. Required: ${item.quantity}, Available: ${product.currentStock}`);
          }

          // Reduce stock
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          // Log stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan ${currentChallan.challanNumber} Confirmed`,
              createdById: req.user!.id,
            },
          });
        }
      }

      // 2. CONFIRMED -> CANCELLED: Return stock (Optional but good ERP logic)
      if (currentChallan.status === 'CONFIRMED' && status === 'CANCELLED') {
        for (const item of currentChallan.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantityChanged: item.quantity,
                movementType: 'IN',
                reason: `Sales Challan ${currentChallan.challanNumber} Cancelled`,
                createdById: req.user!.id,
              },
            });
          }
        }
      }

      // Update status
      return tx.challan.update({
        where: { id },
        data: { status },
        include: { items: true },
      });
    });

    res.status(200).json({
      success: true,
      challan: updatedChallan,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Error updating challan status', 400));
  }
};

export const deleteChallan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({ where: { id } });
    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    if (challan.status === 'CONFIRMED') {
      throw new AppError('Cannot delete a confirmed challan. Cancel it first to restore inventory.', 400);
    }

    await prisma.challan.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Challan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
