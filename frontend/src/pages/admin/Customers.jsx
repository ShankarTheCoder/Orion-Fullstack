import { useState } from 'react';
import * as adminService from '../../services/adminService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatPrice, formatDate } from '../../utils/format';

const EMPTY_FORM = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  status: 'active',
};

export default function Customers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal state: null = closed, 'create' = new customer, customer object = edit customer
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => adminService.getCustomers({ search, status: statusFilter }),
    [search, statusFilter]
  );

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModalMode('create');
  };

  const openEditModal = (customer) => {
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      mobile: customer.mobile || '',
      password: '',
      status: customer.status || 'active',
    });
    setFormError('');
    setModalMode(customer);
  };

  const closeModal = () => {
    setModalMode(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) return setFormError('Name is required.');
    if (!form.email.trim()) return setFormError('Email is required.');
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      return setFormError('Mobile must be a valid 10-digit number.');
    }
    if (modalMode === 'create' && (!form.password || form.password.length < 6)) {
      return setFormError('Password must be at least 6 characters.');
    }
    if (modalMode !== 'create' && form.password && form.password.length < 6) {
      return setFormError('New password must be at least 6 characters.');
    }

    setFormBusy(true);
    try {
      if (modalMode === 'create') {
        await adminService.createCustomer(form);
        toast.success(`Customer "${form.name}" created successfully`);
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          status: form.status,
        };
        if (form.password) payload.password = form.password;
        await adminService.updateCustomer(modalMode.id, payload);
        toast.success(`Customer "${form.name}" updated successfully`);
      }
      closeModal();
      refetch();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormBusy(false);
    }
  };

  const toggleStatus = async (customer) => {
    const next = customer.status === 'blocked' ? 'active' : 'blocked';
    try {
      await adminService.setCustomerStatus(customer.id, next);
      toast.success(`${customer.name} is now ${next}`);
      if (detail?.customer?.id === customer.id) setDetail(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      return;
    }
    try {
      const res = await adminService.deleteCustomer(customer.id);
      toast.success(res.message || 'Customer deleted successfully');
      if (detail?.customer?.id === customer.id) setDetail(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const view = async (customer) => {
    setDetailLoading(true);
    try {
      setDetail(await adminService.getCustomerDetail(customer.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-farm-950">Customers</h1>
          <p className="text-sm text-slate-500">
            Manage store customers, create new accounts, edit profiles, or control access status.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-farm-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-farm-700 transition"
        >
          <span>+</span> Add Customer
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or mobile…"
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-farm-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter customers by status"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-farm-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active only</option>
          <option value="blocked">Blocked only</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-400 font-mono">ID: {c.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{c.email}</div>
                  <div className="text-xs text-slate-500">{c.mobile}</div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{c.orderCount ?? 0}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      c.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-farm-100 text-farm-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => view(c)}
                      className="rounded-md border border-farm-300 bg-white px-2.5 py-1 text-xs font-bold text-farm-800 hover:bg-farm-50 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                        c.status === 'blocked'
                          ? 'border-farm-300 text-farm-800 hover:bg-farm-50'
                          : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      {c.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {!data?.items?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer */}
      {(detailLoading || detail) && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          {detailLoading ? (
            <Loader />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-farm-950">{detail.customer.name}</h2>
                  <p className="mt-0.5 text-xs text-slate-500 font-mono">Customer ID: {detail.customer.id}</p>
                </div>
                <button onClick={() => setDetail(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                  Close ✕
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {detail.customer.email} · {detail.customer.mobile} · Total spent{' '}
                <strong className="text-farm-700">{formatPrice(detail.totalSpent)}</strong> across{' '}
                {detail.orders.length} recent order(s)
              </p>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Recent Orders</h3>
              <ul className="mt-2 divide-y divide-slate-100">
                {detail.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <span>
                      <strong>{o.orderNumber || o.id}</strong> —{' '}
                      {o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}
                    </span>
                    <span>
                      <span className="font-medium text-slate-600">{o.status}</span> ·{' '}
                      <strong>{formatPrice(o.total)}</strong>
                    </span>
                  </li>
                ))}
                {!detail.orders.length && (
                  <li className="py-2 text-sm text-slate-400">This customer has not placed any orders yet.</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-farm-950">
                {modalMode === 'create' ? 'Add New Customer' : `Edit Customer: ${modalMode.name}`}
              </h2>
              <button onClick={closeModal} className="text-sm font-semibold text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{formError}</p>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Pooja Verma"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="pooja@example.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    {modalMode === 'create' ? 'Password *' : 'Password (leave blank to keep)'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={modalMode === 'create' ? 'Min 6 characters' : 'Unchanged'}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-farm-500"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="rounded-lg bg-farm-600 px-5 py-2 text-sm font-bold text-white hover:bg-farm-700 disabled:opacity-60 transition"
                >
                  {formBusy ? 'Saving…' : modalMode === 'create' ? 'Create Customer' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
