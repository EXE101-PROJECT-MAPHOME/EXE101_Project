import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface CompareContextType {
  compareList: any[];
  addToCompare: (property: any) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType>({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
});

export const useCompare = () => useContext(CompareContext);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<any[]>([]);

  useEffect(() => {
    const loadCompareList = async () => {
      try {
        const stored = await AsyncStorage.getItem('@compare_list');
        if (stored) {
          setCompareList(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load compare list', e);
      }
    };
    loadCompareList();
  }, []);

  const saveToStorage = async (list: any[]) => {
    try {
      await AsyncStorage.setItem('@compare_list', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save compare list', e);
    }
  };

  const addToCompare = (property: any) => {
    const propId = property._id || property.id;
    if (compareList.some(p => (p._id || p.id) === propId)) {
      Alert.alert("Thông báo", "Phòng này đã có trong danh sách so sánh");
      return;
    }
    if (compareList.length >= 3) {
      Alert.alert("Giới hạn", "Chỉ có thể so sánh tối đa 3 phòng cùng lúc");
      return;
    }
    const newList = [...compareList, property];
    setCompareList(newList);
    saveToStorage(newList);
    Alert.alert("Thành công", "Đã thêm vào danh sách so sánh");
  };

  const removeFromCompare = (id: string) => {
    const newList = compareList.filter(p => (p._id || p.id) !== id);
    setCompareList(newList);
    saveToStorage(newList);
  };

  const clearCompare = () => {
    setCompareList([]);
    saveToStorage([]);
  };

  const isInCompare = (id: string) => {
    return compareList.some(p => (p._id || p.id) === id);
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
};
