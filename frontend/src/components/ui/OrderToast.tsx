import { CheckCircle, Package, Truck, X } from 'lucide-react';
import React from 'react';

interface OrderDetails {
  orderNumber: string;
  status: string;
  items: Array<{product: string, quantity: number, price: number, subtotal: number}>;
  total: number;
  currency: string;
  estimatedDelivery: string;
  customerInfo: any;
  paymentMethod: string;
  shippingMethod: string;
  notes: string;
  timestamp: string;
}

interface OrderToastProps {
  order: OrderDetails;
  onClose: () => void;
  isVisible: boolean;
}

export const OrderToast: React.FC<OrderToastProps> = ({ order, onClose, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-800">ORDINE IN ARRIVO</h3>
          </div>
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Number */}
        <div className="mb-3">
          <p className="text-lg font-bold text-green-800">#{order.orderNumber}</p>
          <p className="text-sm text-green-600">Ordine confermato con successo!</p>
        </div>

        {/* Order Items */}
        <div className="mb-3">
          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-1">
            <Package className="w-4 h-4" />
            Prodotti ordinati:
          </h4>
          <div className="space-y-1">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-green-700">
                  {item.quantity}x {item.product}
                </span>
                <span className="font-medium text-green-800">
                  €{item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-green-200 mt-2 pt-2">
            <div className="flex justify-between font-bold text-green-800">
              <span>Totale:</span>
              <span>€{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="mb-3">
          <h4 className="font-medium text-green-800 mb-1 flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Consegna stimata:
          </h4>
          <p className="text-sm text-green-700">{order.estimatedDelivery}</p>
        </div>

        {/* Payment Method */}
        <div className="text-sm text-green-600 bg-green-100 rounded p-2">
          <p><strong>Pagamento:</strong> {order.paymentMethod}</p>
          <p><strong>Spedizione:</strong> {order.shippingMethod}</p>
        </div>

        {/* Auto-close timer */}
        <div className="mt-3 text-xs text-green-500 text-center">
          Questo messaggio si chiuderà automaticamente
        </div>
      </div>
    </div>
  );
}; 