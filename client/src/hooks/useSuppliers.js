// hooks/useSuppliers.js — Custom hook untuk CRUD suppliers
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/helpers.js';
import toast from 'react-hot-toast';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/suppliers');
      setSuppliers(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const createSupplier = async (payload) => {
    const { data } = await api.post('/suppliers', payload);
    setSuppliers((prev) => [...prev, data.data]);
    toast.success('Supplier berhasil ditambahkan!');
    return data.data;
  };

  const updateSupplier = async (id, payload) => {
    const { data } = await api.put(`/suppliers/${id}`, payload);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? data.data : s)));
    toast.success('Supplier berhasil diperbarui!');
    return data.data;
  };

  const deleteSupplier = async (id) => {
    await api.delete(`/suppliers/${id}`);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast.success('Supplier berhasil dihapus.');
  };

  return { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier };
}

