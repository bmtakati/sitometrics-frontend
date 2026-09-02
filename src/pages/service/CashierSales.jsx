import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCreditCard, FiFileText, FiRefreshCw, FiSearch } from 'react-icons/fi';
import {
  showQuickError,
  showQuickSuccess,
  showSelectPrompt,
  showTextPrompt,
  showWarningDialog,
} from '../../utils/dialogUtils';
import SearchableSelect from '../../components/SearchableSelect';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { formatMoney } from '../../utils/formatMoney';
import { hasPermission } from '../../utils/permissions';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import {
  downloadPaymentReceipt,
  fetchCashierSales,
  fetchPaymentMethods,
  receivePayment,
} from '../../utils/cashierApi';

const todayInputValue = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const CashierSales = () => {
  const { user } = useAuth();
  const canProcessPayments = hasPermission(user, 'process-payments');
  const [outlets, setOutlets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [salesDate, setSalesDate] = useState(todayInputValue);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/outlets/all`)
      .then((res) => res.json())
      .then((json) => setOutlets(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setOutlets([]));
    fetchPaymentMethods().then(setPaymentMethods);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchCashierSales({
        outletId: outletId || null,
        date: salesDate,
        paymentStatus,
        search: search.trim() || null,
      });
      setOrders(rows);
    } finally {
      setLoading(false);
    }
  }, [outletId, salesDate, paymentStatus, search]);

  useEffect(() => {
    reload();
  }, [reload]);

  const outletOptions = useMemo(
    () => [{ value: '', label: 'All outlets' }, ...outlets.map((row) => ({ value: String(row.id), label: row.name }))],
    [outlets]
  );

  const toggleExpanded = (orderId) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleReceivePayment = async (order) => {
    if (!paymentMethods.length) {
      await showWarningDialog('No payment methods', 'Add payment methods in Setup first.');
      return;
    }

    const methodOptions = paymentMethods.reduce((acc, method) => {
      acc[method.id] = method.name;
      return acc;
    }, {});

    const result = await showSelectPrompt({
      title: `Receive payment — ${order.order_no || order.code}`,
      message: `Amount due: <strong>${formatMoney(order.total)}</strong>`,
      options: methodOptions,
      confirmText: 'Receive payment',
      validator: (value) => (!value ? 'Select a payment method' : undefined),
    });

    if (!result.isConfirmed) return;

    const method = paymentMethods.find((row) => String(row.id) === String(result.value));
    let paymentReference = null;

    if (method?.requires_reference) {
      const refResult = await showTextPrompt({
        title: 'Payment reference',
        placeholder: 'Transaction / approval reference',
        confirmText: 'Continue',
        validator: (value) => (!value?.trim() ? 'Reference is required' : undefined),
      });
      if (!refResult.isConfirmed) return;
      paymentReference = refResult.value.trim();
    }

    try {
      const updated = await receivePayment(order.id, {
        payment_method_id: Number(method.id),
        payment_reference: paymentReference,
      });
      await reload();
      showQuickSuccess(`Payment received${updated.receipt_no ? ` · Receipt ${updated.receipt_no}` : ''}`);
      if (updated.receipt_no) {
        await downloadPaymentReceipt(updated.id, updated.receipt_no);
      }
    } catch (error) {
      showQuickError('Payment failed', error.message);
    }
  };

  const handlePrintReceipt = async (order) => {
    try {
      await downloadPaymentReceipt(order.id, order.receipt_no || order.order_no || order.code);
    } catch (error) {
      showQuickError('Print failed', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiCreditCard}
        title="Cashier Sales"
        subtitle="View closed orders grouped by order number and receive payments"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px]">
          <SearchableSelect options={outletOptions} value={outletId} onChange={setOutletId} placeholder="Filter outlet…" />
        </div>
        <input
          type="date"
          value={salesDate}
          onChange={(e) => setSalesDate(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />
        <div className="inline-flex rounded-lg border border-stone-200 p-1 dark:border-stone-700 dark:bg-stone-900">
          {['unpaid', 'paid', 'all'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setPaymentStatus(status)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                paymentStatus === status ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-300 dark:hover:bg-stone-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order no, ref, waiter…"
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
          />
        </div>
        <button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const isOpen = Boolean(expanded[order.id]);
          const items = order.items || [];

          return (
            <div key={order.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <button type="button" onClick={() => toggleExpanded(order.id)} className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{order.order_no || order.code}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        order.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                      }`}
                    >
                      {order.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {order.outlet?.name} · Table {order.table?.table_number || '—'} · Waiter {order.waiter?.full_name || '—'}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Ref {order.code} · {items.length} item{items.length === 1 ? '' : 's'} · Closed {formatDateTime(order.closed_at)}
                    {order.payment_status === 'PAID' && order.payment_method ? ` · ${order.payment_method.name}` : ''}
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{formatMoney(order.total)}</span>
                  {order.payment_status === 'UNPAID' && canProcessPayments ? (
                    <button
                      type="button"
                      onClick={() => handleReceivePayment(order)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      Receive payment
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(order)}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                    >
                      <FiFileText /> Receipt
                    </button>
                  )}
                  <button type="button" onClick={() => toggleExpanded(order.id)} className="rounded-lg border p-2 text-stone-500 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>

              {isOpen ? (
                <div className="border-t border-stone-200 px-4 py-3 dark:border-stone-700">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase text-stone-500 dark:text-stone-400">
                      <tr>
                        <th className="px-2 py-1">Item</th>
                        <th className="px-2 py-1">Route</th>
                        <th className="px-2 py-1">Qty</th>
                        <th className="px-2 py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t border-stone-100 dark:border-stone-800">
                          <td className="px-2 py-2">
                            <p className="font-medium">{item.description}</p>
                            {item.seat_numbers ? <p className="text-xs text-stone-400 dark:text-stone-500">Seats {item.seat_numbers}</p> : null}
                            {item.remarks ? <p className="text-xs text-stone-400 dark:text-stone-500">Note: {item.remarks}</p> : null}
                          </td>
                          <td className="px-2 py-2">{item.destination}</td>
                          <td className="px-2 py-2">
                            {item.fulfilled_quantity != null && Number(item.fulfilled_quantity) !== Number(item.quantity)
                              ? `${item.fulfilled_quantity}/${item.quantity}`
                              : item.quantity}
                          </td>
                          <td className="px-2 py-2 text-right">{formatMoney(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {order.payment_status === 'PAID' ? (
                    <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                      Paid via {order.payment_method?.name || '—'}
                      {order.payment_reference ? ` · Ref ${order.payment_reference}` : ''}
                      {order.receipt_no ? ` · Receipt ${order.receipt_no}` : ''}
                      {order.paid_at ? ` · ${formatDateTime(order.paid_at)}` : ''}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {!orders.length ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          No {paymentStatus === 'all' ? '' : `${paymentStatus} `}sales on {formatDate(salesDate)}.
        </p>
      ) : null}
    </div>
  );
};

export default CashierSales;
