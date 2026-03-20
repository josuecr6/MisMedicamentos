import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, DAYS } from '../utils/theme';

export default function DayBadges({ selectedDays }) {
  return (
    <View style={styles.daysList}>
      {DAYS.map((day, index) => (
        <View
          key={index}
          style={[
            styles.dayBadge,
            selectedDays?.includes(index)
              ? styles.dayBadgeActive
              : styles.dayBadgeInactive
          ]}
        >
          <Text style={[
            styles.dayBadgeText,
            selectedDays?.includes(index)
              ? styles.dayBadgeTextActive
              : styles.dayBadgeTextInactive
          ]}>
            {day}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  daysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  dayBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  dayBadgeActive: {
    backgroundColor: COLORS.accent
  },
  dayBadgeInactive: {
    backgroundColor: COLORS.surface
  },
  dayBadgeText: {
    fontSize: 12
  },
  dayBadgeTextActive: {
    color: COLORS.bg,
    fontWeight: 'bold'
  },
  dayBadgeTextInactive: {
    color: COLORS.textMuted
  }
});