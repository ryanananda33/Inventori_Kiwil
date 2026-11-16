// hooks/useItems.js — Custom hook untuk CRUD items
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/helpers.js';
import toast from 'react-hot-toast';

export function useItems() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/items');
      setItems(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createItem = async (payload) => {
    const { data } = await api.post('/items', payload);
    setItems((prev) => [...prev, data.data]);
    toast.success('Item berhasil ditambahkan!');
    return data.data;
  };

  const updateItem = async (id, payload) => {
    const { data } = await api.put(`/items/${id}`, payload);
    setItems((prev) => prev.map((it) => (it.id === id ? data.data : it)));
    toast.success('Item berhasil diperbarui!');
    return data.data;
  };

  const deleteItem = async (id) => {
    await api.delete(`/items/${id}`);
    setItems((prev) => prev.filter((it) => it.id !== id));
    toast.success('Item berhasil dihapus.');
  };

  return { items, loading, fetchItems, createItem, updateItem, deleteItem };
}

