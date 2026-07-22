import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getStockMovements = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.query.productId as string;
    const movementType = req.query.movementType as 'IN' | 'OUT';

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        product: {
          select: { productName: true, sku: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      movements,
    });
  } catch (error) {
    next(error);
  }
};

export const createStockMovement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantityChanged, movementType, reason } = req.body;

    if (!req.user) {
      throw new AppError('User session not found', 401);
    }

    // Using transaction to modify product stock and log movement
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      let newStock = product.currentStock;
      if (movementType === 'IN') {
        newStock += quantityChanged;
      } else {
        newStock -= quantityChanged;
        if (newStock < 0) {
          throw new Error('Stock quantity cannot be negative');
        }
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged,
          movementType,
          reason,
          createdById: req.user!.id,
        },
      });

      return { updatedProduct, movement };
    });

    res.status(201).json({
      success: true,
      product: result.updatedProduct,
      movement: result.movement,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Error processing stock movement', 400));
  }
};
