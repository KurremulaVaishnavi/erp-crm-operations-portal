import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = (req.query.search as string) || '';
    const lowStock = req.query.lowStock === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lowStock) {
      where.currentStock = {
        lte: prisma.product.fields.minimumStockAlert,
      };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { productName: 'asc' },
    });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { timestamp: 'desc' },
          take: 20,
          include: {
            createdBy: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      throw new AppError('Product SKU already exists', 400);
    }

    const product = await prisma.product.create({
      data,
    });

    // Automatically create a starting StockMovement record if stock > 0
    if (product.currentStock > 0 && req.user) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: product.currentStock,
          movementType: 'IN',
          reason: 'Initial stock setup',
          createdById: req.user.id,
        },
      });
    }

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        throw new AppError('Product SKU already exists', 400);
      }
    }

    // Track stock change if currentStock is edited manually
    const oldStock = product.currentStock;
    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    if (data.currentStock !== undefined && data.currentStock !== oldStock && req.user) {
      const diff = data.currentStock - oldStock;
      await prisma.stockMovement.create({
        data: {
          productId: id,
          quantityChanged: Math.abs(diff),
          movementType: diff > 0 ? 'IN' : 'OUT',
          reason: 'Manual inventory adjustment',
          createdById: req.user.id,
        },
      });
    }

    res.status(200).json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await prisma.product.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
