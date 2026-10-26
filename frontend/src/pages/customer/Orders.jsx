import * as orderService from '../../services/orderService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatPrice, formatDateTime, ORDER_FLOW } from '../../utils/format';

function StatusTracker({ status }) {
  if (status === 'Cancelled') return <p className="mt-2 text-sm font-bold text-red-600">❌ This order was cancelled.</p>;
  const idx = ORDER_FLOW.indexOf(status);
  return (
    <div className="mt-3 flex items-center">
      {ORDER_FLOW.map((step, i) => (
        <div key={step} className={`flex items-center ${i < ORDER_FLOW.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center">
            <span className={`h-3.5 w-3.5 rounded-full ${i <= idx ? 'bg-farm-600' : 'bg-slate-300'}`} />
            <span className={`mt-1 whitespace-nowrap text-[11px] ${i <= idx ? 'font-bold text-farm-800' : 'text-slate-400'}`}>{step}</span>
          </div>
          {i < ORDER_FLOW.length - 1 && <div className={`mx-1 mb-4 h-0.5 flex-1 ${i < idx ? 'bg-farm-600' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const toast = useToast();
  const { data: orders, loading, error, refetch } = useFetch(() => orderService.getMyOrders(), []);

  const cancel = async (id) => {
    try {
      await orderService.cancelOrder(id);
      toast.success('Order cancelled — stock has been restored');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Loader />;
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>;
  if (!orders?.length) return (
    <div className="rounded-2xl border border-farm-100 bg-white p-10 text-center shadow-card">
      <p className="text-5xl">📦</p>
      <h1 className="mt-3 text-xl font-extrabold text-farm-900">No orders yet</h1>
      <p className="mt-1 text-slate-500">When you place an order it will appear here with live tracking.</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-900">My Orders</h1>
      <div className="mt-5 space-y-4">
        {orders.map((o) => (
          <article key={o.id} className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-slate-900">Order {o.orderNumber || o.id}</p>
              <p className="text-xs text-slate-400">{formatDateTime(o.createdAt)}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-farm-100 text-farm-800'}`}>{o.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}</p>
            <p className="text-sm text-slate-500">🚚 {o.deliveryDate} · {o.slotWindow} · <span className="uppercase">{o.paymentMethod}</span> · <strong className="text-slate-800">{formatPrice(o.total)}</strong></p>
            <StatusTracker status={o.status} />
            {['Placed', 'Confirmed'].includes(o.status) && (
              <button onClick={() => cancel(o.id)} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Cancel Order
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
