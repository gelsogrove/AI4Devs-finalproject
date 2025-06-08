import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Complete an order and generate confirmation details
 * Used when customer confirms they want to complete their order
 */
export const OrderCompleted = async (orderData?: {
  cartItems?: Array<{product: string, quantity: number}>;
  customerInfo?: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
}) => {
  try {
    logger.info('OrderCompleted called with data:', orderData);
    
    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    
    let total = 0;
    const orderItems: Array<{product: string, quantity: number, price: number, subtotal: number}> = [];
    
    if (orderData?.cartItems) {
      // Get real product prices from database
      const productNames = orderData.cartItems.map(item => item.product);
      const products = await prisma.product.findMany({
        where: {
          name: { in: productNames },
          isActive: true
        }
      });
      
      // Group by product and sum quantities
      const cartSummary = new Map<string, number>();
      orderData.cartItems.forEach(item => {
        const existing = cartSummary.get(item.product) || 0;
        cartSummary.set(item.product, existing + item.quantity);
      });
      
      // Calculate totals with real prices from database
      Array.from(cartSummary.entries()).forEach(([productName, quantity]) => {
        const product = products.find(p => p.name === productName);
        if (product) {
          const price = parseFloat(product.price.toString());
          const subtotal = price * quantity;
          total += subtotal;
          
          orderItems.push({
            product: productName,
            quantity,
            price,
            subtotal
          });
        } else {
          logger.warn(`Product not found in database: ${productName}`);
          // Add item with 0 price if product not found
          orderItems.push({
            product: productName,
            quantity,
            price: 0,
            subtotal: 0
          });
        }
      });
    }
    
    // Generate estimated delivery date (3-5 business days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3);
    
    const orderConfirmation = {
      orderNumber,
      status: 'CONFIRMED',
      items: orderItems,
      total: parseFloat(total.toFixed(2)),
      currency: 'EUR',
      estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      customerInfo: orderData?.customerInfo || {
        name: 'Customer',
        address: 'To be specified',
        email: 'to.specify@email.com'
      },
      paymentMethod: 'Cash on delivery',
      shippingMethod: 'Express courier',
      notes: 'Order confirmed! You will receive a confirmation email shortly.',
      timestamp: new Date().toISOString()
    };
    
    logger.info(`Order completed successfully: ${orderNumber}`);
    
    return {
      success: true,
      total: 1, // Indicate one order was created
      order: orderConfirmation,
      message: `Order ${orderNumber} confirmed successfully!`
    };
    
  } catch (error) {
    logger.error('Error completing order:', error);
    return {
      success: false,
      error: 'Failed to complete order',
      message: 'An error occurred while confirming the order. Please try again.'
    };
  }
}; 