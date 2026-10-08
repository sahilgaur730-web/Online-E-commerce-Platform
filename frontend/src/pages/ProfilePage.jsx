import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { User, Phone, Mail, Store, Save, ShieldCheck, MapPin, Plus, Trash2 } from 'lucide-react';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setStoreName(user.storeName || '');
      setStoreDesc(user.storeDescription || '');
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateProfile({
        name,
        phone,
        storeName: user.role === 'SELLER' ? storeName : undefined,
        storeDescription: user.role === 'SELLER' ? storeDesc : undefined,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.deleteAddress(id);
      loadAddresses();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="pb-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Personal Information</h1>
        <p className="text-xs text-gray-500">Manage your profile details and saved shipping addresses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Form: Personal Details */}
        <div className="md:col-span-7 bg-white rounded-xs p-6 shadow-xs border border-gray-200 space-y-4">
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            {success && (
              <div className="p-3 bg-green-50 text-green-700 font-bold rounded border border-green-200">
                Profile updated successfully!
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full p-2.5 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
              />
            </div>

            {user?.role === 'SELLER' && (
              <>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Store / Brand Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Store Description</label>
                  <textarea
                    rows={2}
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#2874F0] hover:bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Saved Addresses List */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-xs p-5 shadow-xs border border-gray-200 space-y-3">
            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#2874F0]" /> Saved Addresses ({addresses.length})
            </h3>

            <div className="space-y-3 text-xs">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-3 border border-gray-200 rounded-xs space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{addr.fullName}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-semibold">
                      {addr.addressType}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {addr.streetAddress}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-gray-500">Phone: {addr.phone}</p>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
