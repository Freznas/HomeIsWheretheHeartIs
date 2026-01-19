import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const SkeletonBox = ({ width = '100%', height = 20, style, borderRadius = 8 }) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: theme.border,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.cardContent}>
        <SkeletonBox width="70%" height={18} style={{ marginBottom: 12 }} />
        <SkeletonBox width="90%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonBox width="50%" height={14} />
      </View>
    </View>
  );
};

export const SkeletonList = ({ count = 5, CardComponent = SkeletonCard }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <CardComponent key={index} />
      ))}
    </View>
  );
};

// Specific skeleton cards for different screens
export const ShoppingItemSkeleton = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.itemCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.itemRow}>
        <SkeletonBox width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <SkeletonBox width="60%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={12} />
        </View>
        <SkeletonBox width={60} height={28} borderRadius={14} />
      </View>
    </View>
  );
};

export const BillItemSkeleton = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.itemCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <SkeletonBox width="50%" height={18} />
          <SkeletonBox width={80} height={24} borderRadius={12} />
        </View>
        <SkeletonBox width="70%" height={14} style={{ marginTop: 12 }} />
        <SkeletonBox width="40%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

export const ChoreItemSkeleton = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.itemCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.itemRow}>
        <SkeletonBox width={28} height={28} borderRadius={6} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <SkeletonBox width="65%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBox width="45%" height={12} />
        </View>
        <SkeletonBox width={70} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

export const NoteItemSkeleton = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.noteCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <SkeletonBox width="60%" height={18} style={{ marginBottom: 12 }} />
      <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonBox width="85%" height={14} />
    </View>
  );
};

export const PantryCategorySkeleton = () => {
  const { theme } = useTheme();
  return (
    <View style={styles.categoryContainer}>
      <SkeletonBox width="40%" height={20} style={{ marginBottom: 16 }} />
      <ShoppingItemSkeleton />
      <ShoppingItemSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryContainer: {
    marginBottom: 24,
  },
});
