import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

const COLORS = {
  bg: '#1c1c1e',
  secondary: '#2c2c2e',
  surface: '#3a3a3c',
  accent: '#ff9f0a',
  text: '#ffffff',
  textMuted: '#8e8e93',
};

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['AM', 'PM'];

function ScrollPicker({ items, selectedValue, onValueChange }) {
  const scrollRef = useRef(null);
  const currentIndex = items.indexOf(selectedValue);

  // useCallback evita recrear estas funciones en cada render del Modal
  const handleScroll = useCallback(
    (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      if (items[clampedIndex] !== selectedValue) {
        onValueChange(items[clampedIndex]);
      }
    },
    [items, selectedValue, onValueChange]
  );

  const scrollToIndex = useCallback(
    (index) => {
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    },
    []
  );

  const handleContentSizeChange = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: currentIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [currentIndex]);

  return (
    <View style={picker.container}>
      <View style={picker.selector} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onContentSizeChange={handleContentSizeChange}
      >
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          return (
            // Key estable: combina valor + índice para evitar colisiones
            <TouchableOpacity
              key={`${item}-${index}`}
              style={picker.item}
              onPress={() => {
                onValueChange(item);
                scrollToIndex(index);
              }}
            >
              <Text style={[picker.itemText, isSelected && picker.itemTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const picker = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    overflow: 'hidden',
    position: 'relative',
  },
  selector: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.accent,
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  itemTextSelected: {
    fontSize: 26,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});

function parseTime(val) {
  if (!val) return { hour: '08', minute: '00', period: 'AM' };
  const parts = val.split(' ');
  const [h, m] = parts[0].split(':');
  return { hour: h, minute: m, period: parts[1] || 'AM' };
}

export default function TimePicker({ value, onChange }) {
  const [visible, setVisible] = useState(false);

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  const handleOpen = useCallback(() => {
    // Sincronizar estado con el value actual al abrir
    const p = parseTime(value);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
    setVisible(true);
  }, [value]);

  const handleConfirm = useCallback(() => {
    onChange(`${selectedHour}:${selectedMinute} ${selectedPeriod}`);
    setVisible(false);
  }, [onChange, selectedHour, selectedMinute, selectedPeriod]);

  const handleCancel = useCallback(() => setVisible(false), []);

  return (
    <View>
      <TouchableOpacity style={styles.timeButton} onPress={handleOpen}>
        <Text style={styles.timeButtonText}>{value || '08:00 AM'}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Seleccionar hora</Text>
            </View>

            <View style={styles.pickersRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Hora</Text>
                <ScrollPicker
                  items={hours}
                  selectedValue={selectedHour}
                  onValueChange={setSelectedHour}
                />
              </View>

              <Text style={styles.colon}>:</Text>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Min</Text>
                <ScrollPicker
                  items={minutes}
                  selectedValue={selectedMinute}
                  onValueChange={setSelectedMinute}
                />
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>AM/PM</Text>
                <ScrollPicker
                  items={periods}
                  selectedValue={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                />
              </View>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  timeButton: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  timeButtonText: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 4,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  pickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
