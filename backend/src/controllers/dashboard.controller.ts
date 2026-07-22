import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Core metric queries
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({
      where: { status: 'ACTIVE' },
    });
    const totalProducts = await prisma.product.count();

    const stockSumResult = await prisma.product.aggregate({
      _sum: {
        currentStock: true,
      },
    });
    const totalStock = stockSumResult._sum.currentStock || 0;

    const totalChallans = await prisma.challan.count();

    // Products where currentStock <= minimumStockAlert
    const lowStockCount = await prisma.product.count({
      where: {
        currentStock: {
          lte: prisma.product.fields.minimumStockAlert,
        },
      },
    });

    // 2. Recent activities (take 5)
    const recentCustomers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        customerName: true,
        businessName: true,
        status: true,
        createdAt: true,
      },
    });

    const recentStockMovements = await prisma.stockMovement.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        product: {
          select: { productName: true, sku: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    const recentChallans = await prisma.challan.findMany({
      orderBy: { createdDate: 'desc' },
      take: 5,
      include: {
        customer: {
          select: { customerName: true, businessName: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    // 3. Customer Status Distribution for Charts
    const leadCount = await prisma.customer.count({ where: { status: 'LEAD' } });
    const activeCount = await prisma.customer.count({ where: { status: 'ACTIVE' } });
    const inactiveCount = await prisma.customer.count({ where: { status: 'INACTIVE' } });

    // 4. Stock Overview: Top 5 items with highest stock vs lowest stock
    const topStockProducts = await prisma.product.findMany({
      orderBy: { currentStock: 'desc' },
      take: 5,
      select: {
        productName: true,
        currentStock: true,
        minimumStockAlert: true,
      },
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalCustomers,
        activeCustomers,
        totalProducts,
        totalStock,
        totalChallans,
        lowStockProducts: lowStockCount,
      },
      recentActivities: {
        recentCustomers,
        recentStockMovements,
        recentChallans,
      },
      charts: {
        customerDistribution: [
          { status: 'LEAD', count: leadCount },
          { status: 'ACTIVE', count: activeCount },
          { status: 'INACTIVE', count: inactiveCount },
        ],
        stockOverview: topStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
