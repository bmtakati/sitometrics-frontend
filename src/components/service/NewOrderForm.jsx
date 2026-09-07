import React from 'react';
import { FiPlus } from 'react-icons/fi';
import SearchableSelect from '../SearchableSelect';
import SignaturePad from './SignaturePad';

const NewOrderForm = ({
  outletId,
  onOutletChange,
  outletOptions,
  orderTypeId,
  onOrderTypeChange,
  orderTypeOptions,
  selectedOrderType,
  roomNumber,
  onRoomNumberChange,
  guestSignature,
  onGuestSignatureChange,
  tableId,
  onTableChange,
  tableOptions,
  newOrderRemarks,
  onNewOrderRemarksChange,
  loading,
  onCreateOrder,
  hideOutlet = false,
  touchFriendly = false,
}) => {
  const fieldClass = touchFriendly
    ? 'w-full rounded-xl border px-4 py-3 text-base dark:border-stone-600 dark:bg-stone-800'
    : 'w-full rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800';
  const labelClass = touchFriendly ? 'mb-1.5 block text-sm font-semibold' : 'mb-1 block text-sm font-medium';

  return (
  <>
    {!hideOutlet ? (
      <div>
        <label className={labelClass}>Outlet</label>
        <SearchableSelect options={outletOptions} value={outletId} onChange={onOutletChange} placeholder="Select outlet…" />
      </div>
    ) : null}
    <div>
      <label className={labelClass}>Order type</label>
      <SearchableSelect options={orderTypeOptions} value={orderTypeId} onChange={onOrderTypeChange} placeholder="Select order type…" />
    </div>
    {selectedOrderType?.requires_room_number ? (
      <div>
        <label className={labelClass}>Room number</label>
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => onRoomNumberChange(e.target.value)}
          placeholder="e.g. 204"
          className={fieldClass}
        />
      </div>
    ) : null}
    {selectedOrderType?.requires_guest_signature ? (
      <div>
        <label className={labelClass}>Guest signature</label>
        <SignaturePad value={guestSignature} onChange={onGuestSignatureChange} />
      </div>
    ) : null}
    <div>
      <label className={labelClass}>Table</label>
      <SearchableSelect options={tableOptions} value={tableId} onChange={onTableChange} placeholder="Select available table…" />
    </div>
    <div>
      <label className={labelClass}>Order note</label>
      <textarea
        value={newOrderRemarks}
        onChange={(e) => onNewOrderRemarksChange(e.target.value)}
        rows={touchFriendly ? 3 : 2}
        placeholder="General comments for kitchen/bar…"
        className={fieldClass}
      />
    </div>
    <button
      type="button"
      disabled={loading}
      onClick={onCreateOrder}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 ${
        touchFriendly ? 'min-h-14 px-4 py-3 text-base' : 'px-4 py-2.5 text-sm'
      }`}
    >
      <FiPlus /> Create order
    </button>
  </>
  );
};

export default NewOrderForm;
