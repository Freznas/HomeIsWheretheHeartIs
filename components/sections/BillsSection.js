import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserHousehold, subscribeToBills } from '../../config/firebase';

export default function BillsSection({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [bills, setBills] = useState([]);
  const [nextBill, setNextBill] = useState(null);
  const [billCount, setBillCount] = useState(0);

  // 🔥 Firebase - Hämta räkningar
  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    const loadData = async () => {
      if (!currentUser?.id) {
        console.log('BillsSection: No user');
        return;
      }

      try {
        console.log('BillsSection: Loading bills for user:', currentUser.id);
        const result = await getUserHousehold(currentUser.id);
        
        if (result.success && result.householdId) {
          console.log('BillsSection: Subscribing to bills for household:', result.householdId);
          unsubscribe = subscribeToBills(result.householdId, (response) => {
            if (!isMounted) return;
            
            console.log('BillsSection: Bills update received:', response.bills?.length || 0);
            if (response.success) {
              setBills(response.bills || []);
            }
          });
        } else {
          console.log('BillsSection: No household found');
        }
      } catch (error) {
        console.error('BillsSection: Error loading bills:', error);
      }
    };

    loadData();

    return () => {
      console.log('BillsSection: Cleanup');
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  useEffect(() => {
    if (bills && bills.length > 0) {
      // Räkna totalt antal räkningar
      setBillCount(bills.length);
      
      // Hitta nästa räkning att betala (ej betald, närmast förfallodatum)
      const unpaid = bills
        .filter(b => b.status === "Ej betald" && b.dueDate)
        .map(b => ({
          ...b,
          dueDateObj: new Date(b.dueDate)
        }))
        .sort((a, b) => a.dueDateObj - b.dueDateObj);
      
      setNextBill(unpaid.length > 0 ? unpaid[0] : null);
    } else {
      setBillCount(0);
      setNextBill(null);
    }
  }, [bills]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('bills.today');
    if (diffDays === 1) return t('bills.tomorrow');
    if (diffDays < 0) return `${Math.abs(diffDays)} ${t('bills.daysAgo')}`;
    if (diffDays <= 7) return `${t('bills.inDays')} ${diffDays} ${t('bills.days')}`;
    
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("BillsPage")}
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>💳</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t('home.bills')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.error }]}>
          {billCount} {billCount === 1 ? t('bills.bill') : t('bills.bills')}
        </Text>
        {nextBill ? (
          <View style={styles.nextBillInfo}>
            <Text style={[styles.nextBillName, { color: theme.text }]} numberOfLines={1}>
              {nextBill.name}
            </Text>
            <Text style={[styles.nextBillAmount, { color: theme.textSecondary }]}>
              {nextBill.amount} kr • {formatDate(nextBill.dueDate)}
            </Text>
          </View>
        ) : (
          <Text style={[styles.dueInfo, { color: theme.textSecondary }]}>
            {t('bills.noUnpaid')}
          </Text>
        )})
      </View>
      {nextBill && (
        <View style={[styles.statusBadge, { backgroundColor: theme.error + '20' }]}>
          <Text style={[styles.statusText, { color: theme.error }]}>{t('bills.attention')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    backgroundColor: "#ffe0e0ff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    padding: 12,
    height: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  itemCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e91e63",
    marginBottom: 4,
  },
  dueInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  nextBillInfo: {
    marginBottom: 8,
  },
  nextBillName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  nextBillAmount: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fce4ec",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#e91e63",
  },
});

