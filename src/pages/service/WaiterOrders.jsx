import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBell, FiCheck, FiCoffee, FiFileText, FiLock, FiTrash2, FiX } from 'react-icons/fi';
import {
  showQuickError,
  showQuickSuccess,
  showWarningDialog,
} from '../../utils/dialogUtils';
import SearchableSelect from '../../components/SearchableSelect';
import PageHeader from '../../components/PageHeader';
import SignaturePad from '../../components/service/SignaturePad';
import OrderStatusPill from '../../components/service/OrderStatusPill';
import WaiterOrdersSidebar from '../../components/service/WaiterOrdersSidebar';
import { canCancelOpenOrder, canCloseOrder } from '../../components/service/orderStatusStyles';
import useOrderNotifications from '../../hooks/useOrderNotifications';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/formatMoney';
import { hasPermission } from '../../utils/permissions';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import {
  addOrderItem,
  approveComplementaryOrder,
  cancelOrder,
  closeOrder,
  canPrintWaiterOrder,
  createOrder,
  downloadOrderPdf,
  fetchActiveOrders,
  fetchAvailableTables,
  fetchOrder,
  fetchPendingComplementaryOrders,
  markItemServed,
  rejectComplementaryOrder,
  removeOrderItem,
  submitOrder,
  updateOrderDetails,
} from '../../utils/waiterOrderApi';

const parseSeatList = (value) =>
  String(value || '')
    .split(',')
    .map((seat) => seat.trim())
    .filter(Boolean);

const WaiterOrders = () => {
  const { user } = useAuth();
  const canApproveComplementary = hasPermission(user, 'approve-complementary-orders');
  const [outlets, setOutlets] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [beverages, setBeverages] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [tableId, setTableId] = useState('');
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lineType, setLineType] = useState('MENU');
  const [catalogId, setCatalogId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemRemarks, setItemRemarks] = useState('');
  const [seatNumbers, setSeatNumbers] = useState('');
  const [orderRemarks, setOrderRemarks] = useState('');
  const [newOrderRemarks, setNewOrderRemarks] = useState('');
  const [orderTypeId, setOrderTypeId] = useState('');
  const [isComplementary, setIsComplementary] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [guestSignature, setGuestSignature] = useState(null);
  const [pendingComplementary, setPendingComplementary] = useState([]);
  const [expandedPanel, setExpandedPanel] = useState('active');

  const { notifications, markRead, unreadCount, refresh: refreshNotifications } = useOrderNotifications('WAITER');

  const selectedOrderType = useMemo(
    () => orderTypes.find((row) => String(row.id) === String(orderTypeId)),
    [orderTypes, orderTypeId]
  );

  const activeSelectedOrderType = useMemo(
    () => selectedOrder?.order_type || selectedOrder?.orderType,
    [selectedOrder]
  );

  const editingOrderType = useMemo(
    () => orderTypes.find((row) => String(row.id) === String(orderTypeId)) || activeSelectedOrderType,
    [orderTypes, orderTypeId, activeSelectedOrderType]
  );

  const loadCatalog = useCallback(async () => {
    const [outletsRes, orderTypesRes, menusRes, foodRes, bevRes] = await Promise.all([
      apiFetch(`${API_BASE_URL}/api/outlets/all`),
      apiFetch(`${API_BASE_URL}/api/order-types/all`),
      apiFetch(`${API_BASE_URL}/api/menus/all`),
      apiFetch(`${API_BASE_URL}/api/food-categories/all`),
      apiFetch(`${API_BASE_URL}/api/beverage-categories/all`),
    ]);

    const outletsJson = await outletsRes.json().catch(() => ({}));
    const orderTypesJson = await orderTypesRes.json().catch(() => ({}));
    const menusJson = await menusRes.json().catch(() => ({}));
    const foodJson = await foodRes.json().catch(() => ({}));
    const bevJson = await bevRes.json().catch(() => ({}));

    const types = Array.isArray(orderTypesJson?.data) ? orderTypesJson.data : [];
    setOutlets(Array.isArray(outletsJson?.data) ? outletsJson.data : []);
    setOrderTypes(types);
    setMenus(Array.isArray(menusJson?.data) ? menusJson.data : []);
    setFoods((Array.isArray(foodJson?.data) ? foodJson.data : []).flatMap((cat) => cat.foods || []));
    setBeverages((Array.isArray(bevJson?.data) ? bevJson.data : []).flatMap((cat) => cat.beverages || []));
    if (types[0]) {
      setOrderTypeId((prev) => prev || String(types[0].id));
    }
  }, []);

  const reloadOrders = useCallback(async () => {
    const rows = await fetchActiveOrders(outletId || null);
    setOrders(rows);
    if (selectedOrder?.id) {
      const stillActive = rows.some((row) => row.id === selectedOrder.id);
      if (!stillActive) {
        setSelectedOrder(null);
        return;
      }
      const fresh = await fetchOrder(selectedOrder.id);
      if (fresh) {
        setSelectedOrder(fresh);
        setOrderRemarks(fresh.remarks || '');
      } else {
        setSelectedOrder(null);
      }
    }
  }, [outletId, selectedOrder?.id]);

  const reloadPendingComplementary = useCallback(async () => {
    if (!canApproveComplementary) {
      setPendingComplementary([]);
      return;
    }
    const rows = await fetchPendingComplementaryOrders(outletId || null);
    setPendingComplementary(rows);
  }, [canApproveComplementary, outletId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    reloadOrders();
    reloadPendingComplementary();
  }, [reloadOrders, reloadPendingComplementary]);

  useEffect(() => {
    if (!outletId) {
      setTables([]);
      setTableId('');
      return;
    }
    fetchAvailableTables(outletId).then(setTables);
  }, [outletId]);

  useEffect(() => {
    setOrderRemarks(selectedOrder?.remarks || '');
    if (selectedOrder?.workflow_status === 'DRAFT') {
      setOrderTypeId(String(selectedOrder.order_type_id || selectedOrder.order_type?.id || orderTypeId || ''));
      setIsComplementary(Boolean(selectedOrder.is_complementary));
      setRoomNumber(selectedOrder.room_number || '');
      setGuestSignature(selectedOrder.guest_signature || null);
    }
  }, [selectedOrder?.id, selectedOrder?.remarks, selectedOrder?.workflow_status, selectedOrder?.order_type_id, selectedOrder?.is_complementary, selectedOrder?.room_number, selectedOrder?.guest_signature, selectedOrder?.order_type, orderTypeId]);

  const orderTypeOptions = useMemo(
    () => orderTypes.map((row) => ({ value: String(row.id), label: row.name })),
    [orderTypes]
  );

  const outletOptions = useMemo(
    () => outlets.map((row) => ({ value: String(row.id), label: `${row.name} (${row.code})` })),
    [outlets]
  );

  const tableOptions = useMemo(
    () => tables.map((row) => ({ value: String(row.id), label: `Table ${row.table_number}${row.name ? ` — ${row.name}` : ''}` })),
    [tables]
  );

  const catalogOptions = useMemo(() => {
    if (lineType === 'MENU') {
      return menus.map((row) => ({ value: String(row.id), label: `${row.name} (${row.code})` }));
    }
    if (lineType === 'FOOD') {
      return foods.map((row) => ({ value: String(row.id), label: `${row.name} (${row.code})` }));
    }
    return beverages.map((row) => ({ value: String(row.id), label: `${row.name} (${row.code})` }));
  }, [lineType, menus, foods, beverages]);

  const activeTableSeats = useMemo(() => {
    const table =
      selectedOrder?.table ||
      tables.find((row) => String(row.id) === String(selectedOrder?.outlet_table_id || tableId));
    return table?.table_seats || table?.tableSeats || [];
  }, [selectedOrder, tables, tableId]);

  const toggleSidebarPanel = (panel) => {
    setExpandedPanel((current) => (current === panel ? null : panel));
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setExpandedPanel('active');
  };

  const toggleSeat = (seatNumber) => {
    const current = parseSeatList(seatNumbers);
    const next = current.includes(seatNumber)
      ? current.filter((seat) => seat !== seatNumber)
      : [...current, seatNumber];
    setSeatNumbers(next.join(','));
  };

  const handleCreateOrder = async () => {
    if (!outletId) {
      await showWarningDialog('Select an outlet first');
      return;
    }
    if (!orderTypeId) {
      await showWarningDialog('Select an order type');
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder({
        outlet_id: Number(outletId),
        outlet_table_id: tableId ? Number(tableId) : null,
        order_type_id: Number(orderTypeId),
        is_complementary: isComplementary,
        room_number: roomNumber.trim() || null,
        guest_signature: guestSignature,
        remarks: newOrderRemarks.trim() || null,
      });
      setSelectedOrder(order);
      setOrderRemarks(order.remarks || '');
      setNewOrderRemarks('');
      setIsComplementary(false);
      setRoomNumber('');
      setGuestSignature(null);
      setExpandedPanel('active');
      await reloadOrders();
      await reloadPendingComplementary();
      if (outletId) fetchAvailableTables(outletId).then(setTables);
    } catch (error) {
      showQuickError('Could not create order', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder?.id || selectedOrder.workflow_status !== 'DRAFT') return;
    setLoading(true);
    try {
      const updated = await updateOrderDetails(selectedOrder.id, {
        remarks: orderRemarks.trim() || null,
        order_type_id: orderTypeId ? Number(orderTypeId) : null,
        is_complementary: isComplementary,
        room_number: roomNumber.trim() || null,
        guest_signature: guestSignature,
      });
      setSelectedOrder(updated);
      await reloadOrders();
      await reloadPendingComplementary();
    } catch (error) {
      showQuickError('Could not save order details', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedOrder || !catalogId) return;
    setLoading(true);
    try {
      const payload = {
        line_type: lineType,
        quantity: Math.max(1, parseInt(String(quantity), 10) || 1),
        remarks: itemRemarks.trim() || null,
        seat_numbers: seatNumbers.trim() || null,
      };
      if (lineType === 'MENU') payload.menu_id = Number(catalogId);
      if (lineType === 'FOOD') payload.food_id = Number(catalogId);
      if (lineType === 'BEVERAGE') payload.beverage_id = Number(catalogId);

      const updated = await addOrderItem(selectedOrder.id, payload);
      setSelectedOrder(updated);
      setCatalogId('');
      setItemRemarks('');
      setSeatNumbers('');
      setQuantity(1);
      await reloadOrders();
    } catch (error) {
      showQuickError('Could not add item', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!selectedOrder?.id) return;
    if (selectedOrder.workflow_status === 'DRAFT') {
      await handleSaveDetails();
      return;
    }
    setLoading(true);
    try {
      const updated = await updateOrderDetails(selectedOrder.id, { remarks: orderRemarks.trim() || null });
      setSelectedOrder(updated);
      await reloadOrders();
    } catch (error) {
      showQuickError('Could not save note', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplementaryDecision = async (orderId, approve) => {
    setLoading(true);
    try {
      if (approve) {
        await approveComplementaryOrder(orderId);
      } else {
        await rejectComplementaryOrder(orderId);
      }
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      await reloadOrders();
      await reloadPendingComplementary();
      showQuickSuccess(approve ? 'Complementary order approved' : 'Complementary order rejected');
    } catch (error) {
      showQuickError('Action failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (label, fn) => {
    setLoading(true);
    try {
      const updated = await fn();
      if (label === 'Order closed' || updated?.workflow_status === 'CLOSED' || updated?.workflow_status === 'CANCELLED') {
        setSelectedOrder(null);
      } else {
        setSelectedOrder(updated);
      }
      await reloadOrders();
      if (outletId) fetchAvailableTables(outletId).then(setTables);
      showQuickSuccess(label);
    } catch (error) {
      showQuickError('Action failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedOrder?.id) return;
    try {
      await downloadOrderPdf(selectedOrder.id, selectedOrder.order_no || selectedOrder.code);
    } catch (error) {
      showQuickError('Print failed', error.message);
    }
  };

  const closeDisabled = selectedOrder ? !canCloseOrder(selectedOrder) : true;
  const orderHasItems = (selectedOrder?.items_count ?? selectedOrder?.items?.length ?? 0) > 0;
  const cancelOpenDisabled = selectedOrder ? !canCancelOpenOrder(selectedOrder) : true;
  const canModifyItems = ['DRAFT', 'OPEN'].includes(selectedOrder?.workflow_status);

  const newOrderProps = {
    outletId,
    onOutletChange: setOutletId,
    outletOptions,
    orderTypeId,
    onOrderTypeChange: setOrderTypeId,
    orderTypeOptions,
    selectedOrderType,
    roomNumber,
    onRoomNumberChange: setRoomNumber,
    guestSignature,
    onGuestSignatureChange: setGuestSignature,
    tableId,
    onTableChange: setTableId,
    tableOptions,
    newOrderRemarks,
    onNewOrderRemarksChange: setNewOrderRemarks,
    loading,
    onCreateOrder: handleCreateOrder,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiCoffee}
        title="Waiter Orders"
        subtitle="Create guest orders, route food to kitchen and beverages to bar"
        actions={[
          {
            label: unreadCount ? `Alerts (${unreadCount})` : 'Alerts',
            icon: FiBell,
            onClick: refreshNotifications,
          },
        ]}
      />

      {pendingComplementary.length > 0 ? (
        <div className="rounded-xl border border-violet-300 bg-violet-50 p-4 dark:border-violet-700 dark:bg-violet-950/30">
          <p className="mb-2 text-sm font-semibold text-violet-900 dark:text-violet-200">Complementary orders awaiting approval</p>
          <div className="space-y-2">
            {pendingComplementary.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-stone-900/60">
                <div>
                  <span className="font-semibold">{order.order_no || order.code}</span>
                  <span className="ml-2 text-stone-500">
                    {order.outlet?.name} · Waiter {order.waiter?.full_name || '—'} · {formatMoney(order.total || 0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleComplementaryDecision(order.id, true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <FiCheck /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleComplementaryDecision(order.id, false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600"
                  >
                    <FiX /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">Items ready for pickup</p>
          <div className="space-y-2">
            {notifications.map((note) => (
              <div key={note.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{note.body}</span>
                <button
                  type="button"
                  onClick={() => markRead(note.id)}
                  className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <WaiterOrdersSidebar
          expandedPanel={expandedPanel}
          onTogglePanel={toggleSidebarPanel}
          newOrderProps={newOrderProps}
          orders={orders}
          selectedOrderId={selectedOrder?.id}
          onSelectOrder={handleSelectOrder}
          onReloadOrders={reloadOrders}
        />

        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          {!selectedOrder ? (
            <p className="text-sm text-stone-500">Select or create an order to start adding items.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedOrder.order_no || selectedOrder.code}</h2>
                    <OrderStatusPill status={selectedOrder.workflow_status} />
                    {selectedOrder.preparation_locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                        <FiLock className="h-3 w-3" /> Kitchen/bar preparing
                      </span>
                    ) : null}
                    {selectedOrder.is_complementary ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                        Complementary
                        {selectedOrder.complementary_status === 'PENDING' ? ' · Pending approval' : ''}
                        {selectedOrder.complementary_status === 'APPROVED' ? ' · Approved' : ''}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-stone-500">
                    Ref {selectedOrder.code} · {selectedOrder.outlet?.name} · Table {selectedOrder.table?.table_number || '—'} · Waiter{' '}
                    {selectedOrder.waiter?.full_name || '—'}
                    {activeSelectedOrderType ? ` · ${activeSelectedOrderType.name}` : ''}
                    {selectedOrder.room_number ? ` · Room ${selectedOrder.room_number}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {orderHasItems && canPrintWaiterOrder(selectedOrder) ? (
                    <button type="button" onClick={handlePrint} className="rounded-lg border px-3 py-2 text-sm">
                      <FiFileText className="inline" /> Print receipt
                    </button>
                  ) : null}
                  {selectedOrder.workflow_status === 'DRAFT' ? (
                    <>
                      {orderHasItems ? (
                        <button
                          type="button"
                          disabled={loading || selectedOrder.is_complementary && selectedOrder.complementary_status !== 'APPROVED'}
                          title={
                            selectedOrder.is_complementary && selectedOrder.complementary_status !== 'APPROVED'
                              ? 'Complementary orders need hotel manager approval before submitting'
                              : 'Submit to kitchen/bar'
                          }
                          onClick={() => runAction('Order submitted', () => submitOrder(selectedOrder.id))}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Submit to kitchen/bar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => runAction('Order cancelled', () => cancelOrder(selectedOrder.id))}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                  {selectedOrder.workflow_status === 'OPEN' ? (
                    <>
                      <button
                        type="button"
                        disabled={loading || closeDisabled}
                        title={closeDisabled ? 'Receive all items before closing' : 'Close order'}
                        onClick={() => runAction('Order closed', () => closeOrder(selectedOrder.id))}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Close order
                      </button>
                      <button
                        type="button"
                        disabled={loading || cancelOpenDisabled}
                        title={
                          selectedOrder.preparation_locked
                            ? 'Order is locked while kitchen or bar is preparing'
                            : cancelOpenDisabled
                              ? 'Receive all items before cancelling'
                              : 'Cancel order'
                        }
                        onClick={() => runAction('Order cancelled', () => cancelOrder(selectedOrder.id))}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {selectedOrder.workflow_status === 'DRAFT' ? (
                <div className="space-y-3 rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                  <p className="text-sm font-medium">Order details</p>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Order type</label>
                    <SearchableSelect options={orderTypeOptions} value={orderTypeId} onChange={setOrderTypeId} placeholder="Select order type…" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isComplementary} onChange={(e) => setIsComplementary(e.target.checked)} />
                    Complementary order
                  </label>
                  {(editingOrderType?.requires_room_number) ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Room number</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                      />
                    </div>
                  ) : null}
                  {(editingOrderType?.requires_guest_signature) ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Guest signature</label>
                      <SignaturePad value={guestSignature} onChange={setGuestSignature} />
                    </div>
                  ) : null}
                  <button type="button" onClick={handleSaveDetails} className="rounded-lg border px-3 py-2 text-sm">
                    Save order details
                  </button>
                </div>
              ) : null}

              <div className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                <label className="mb-1 block text-sm font-medium">Order note</label>
                <textarea
                  value={orderRemarks}
                  onChange={(e) => setOrderRemarks(e.target.value)}
                  onBlur={handleSaveRemarks}
                  rows={2}
                  disabled={!['DRAFT', 'OPEN'].includes(selectedOrder.workflow_status)}
                  placeholder="General comments for this order…"
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                />
              </div>

              {canModifyItems ? (
                <div className="space-y-3 rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                  <p className="text-sm font-medium">
                    {selectedOrder.workflow_status === 'OPEN' ? 'Add more items (sent immediately)' : 'Add items'}
                  </p>
                  <div className="grid gap-3 md:grid-cols-[140px_1fr_90px_auto]">
                    <select
                      value={lineType}
                      onChange={(e) => {
                        setLineType(e.target.value);
                        setCatalogId('');
                      }}
                      className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                    >
                      <option value="MENU">Menu</option>
                      <option value="FOOD">Food item</option>
                      <option value="BEVERAGE">Beverage</option>
                    </select>
                    <SearchableSelect options={catalogOptions} value={catalogId} onChange={setCatalogId} placeholder="Select item…" />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleAddItem}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Add
                    </button>
                  </div>
                  {activeTableSeats.length ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Seat numbers</p>
                      <div className="flex flex-wrap gap-2">
                        {activeTableSeats.map((seat) => {
                          const seatNo = seat.seat_number;
                          const selected = parseSeatList(seatNumbers).includes(seatNo);
                          return (
                            <button
                              key={seat.id || seatNo}
                              type="button"
                              onClick={() => toggleSeat(seatNo)}
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                selected
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-stone-300 text-stone-600 dark:border-stone-600'
                              }`}
                            >
                              Seat {seatNo}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <input
                    type="text"
                    value={seatNumbers}
                    onChange={(e) => setSeatNumbers(e.target.value)}
                    placeholder="Seat numbers (comma-separated)"
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    value={itemRemarks}
                    onChange={(e) => setItemRemarks(e.target.value)}
                    placeholder="Item comment (e.g. no ice, well done)"
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                  />
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500 dark:bg-stone-800">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Seats</th>
                      <th className="px-3 py-2">Route</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={item.id} className="border-t border-stone-100 dark:border-stone-800">
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.description}</p>
                          {item.remarks ? <p className="text-xs text-stone-500">Note: {item.remarks}</p> : null}
                        </td>
                        <td className="px-3 py-2">{item.seat_numbers || '—'}</td>
                        <td className="px-3 py-2">{item.destination}</td>
                        <td className="px-3 py-2">
                          {item.fulfilled_quantity != null && Number(item.fulfilled_quantity) !== Number(item.quantity)
                            ? `${item.fulfilled_quantity}/${item.quantity}`
                            : item.quantity}
                        </td>
                        <td className="px-3 py-2">{formatMoney(item.line_total)}</td>
                        <td className="px-3 py-2">
                          <OrderStatusPill status={item.item_status} type="item" />
                        </td>
                        <td className="px-3 py-2 text-right">
                          {selectedOrder.workflow_status === 'DRAFT' ? (
                            <button
                              type="button"
                              onClick={() => runAction('Item removed', () => removeOrderItem(selectedOrder.id, item.id))}
                              className="text-red-500"
                            >
                              <FiTrash2 />
                            </button>
                          ) : null}
                          {['READY', 'DEPLETED'].includes(item.item_status) ? (
                            <button
                              type="button"
                              onClick={async () => {
                                setLoading(true);
                                try {
                                  await markItemServed(item.id);
                                  const fresh = await fetchOrder(selectedOrder.id);
                                  setSelectedOrder(fresh);
                                  await reloadOrders();
                                } catch (error) {
                                  showQuickError('Failed', error.message);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                            >
                              {item.item_status === 'DEPLETED' ? 'Acknowledge' : 'Received'}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end text-lg font-bold">Total: {formatMoney(selectedOrder.total || 0)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterOrders;
