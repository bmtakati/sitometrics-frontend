import React, { useState } from 'react';
import { FiMinusCircle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const ConsumptionPosting = () => {
  const [form, setForm] = useState({
    menu_id: '',
    store_id: '',
    quantity_sold: '',
    transaction_date: '',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/consumptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_id: Number(form.menu_id),
          store_id: Number(form.store_id),
          quantity_sold: Number(form.quantity_sold),
          transaction_date: form.transaction_date || null,
          remarks: form.remarks || null
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Failed to post consumption');
      }

      setResult(payload?.data || null);
    } catch (err) {
      setError(err.message || 'Unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        icon={FiMinusCircle}
        title="Consumption Posting"
        subtitle="Post ingredient deductions from menu sales"
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="menu_id"
            value={form.menu_id}
            onChange={onChange}
            type="number"
            min="1"
            placeholder="Menu ID"
            className="border rounded px-3 py-2 dark:bg-gray-950"
            required
          />
          <input
            name="store_id"
            value={form.store_id}
            onChange={onChange}
            type="number"
            min="1"
            placeholder="Store ID"
            className="border rounded px-3 py-2 dark:bg-gray-950"
            required
          />
          <input
            name="quantity_sold"
            value={form.quantity_sold}
            onChange={onChange}
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="Quantity Sold"
            className="border rounded px-3 py-2 dark:bg-gray-950"
            required
          />
          <input
            name="transaction_date"
            value={form.transaction_date}
            onChange={onChange}
            type="date"
            className="border rounded px-3 py-2 dark:bg-gray-950"
          />
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={onChange}
            rows={3}
            placeholder="Remarks (optional)"
            className="md:col-span-2 border rounded px-3 py-2 dark:bg-gray-950"
          />
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {submitting ? 'Posting...' : 'Post Consumption'}
          </button>
        </form>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {result && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Posted Movements</h3>
            <pre className="text-xs overflow-auto p-3 rounded bg-gray-100 dark:bg-gray-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionPosting;
