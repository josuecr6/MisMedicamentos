import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS } from '../utils/theme';

const ITEM_HEIGHT = 54;
const VISIBLE = 5;
const REPEAT = 120;

const HOURS_BASE = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));

function buildList(base) {
  const arr = [];
  for (let repeatIndex = 0; repeatIndex < REPEAT; repeatIndex += 1) {
    for (let valueIndex = 0; valueIndex < base.length; valueIndex += 1) {
      arr.push(`${repeatIndex}-${valueIndex}`);
    }
  }
  return arr;
}

const HOURS_KEYS = buildList(HOURS_BASE);

function getInitialIndex(value) {
  const idx = HOURS_BASE.indexOf(value);
  const safeIdx = idx >= 0 ? idx : 0;
  return Math.floor(REPEAT / 2) * HOURS_BASE.length + safeIdx;
}

function parseHour(val) {
  if (!val) return { hour: '08', period: 'AM' };
  const parts = val.split(' ');
  const period = parts[1] || 'AM';
  const hour = parts[0].split(':')[0];
  return { hour, period };
}

export function buildTimeString(hour, period) {
  return `${hour}:00 ${period}`;
}

function Drum({ selectedValue, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    const targetIndex = getInitialIndex(selectedValue);
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollToIndex({
        index: targetIndex,
        animated: false,
        viewPosition: 0.5,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedValue]);

  const onScrollEnd = useCallback(
    (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_HEIGHT);
      const mod = ((idx % HOURS_BASE.length) + HOURS_BASE.length) % HOURS_BASE.length;
      onSelect(HOURS_BASE[mod]);
    },
    [onSelect]
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ index }) => {
      const mod = ((index % HOURS_BASE.length) + HOURS_BASE.length) % HOURS_BASE.length;
      const value = HOURS_BASE[mod];
      const isSelected = value === selectedValue;
      return (
        <View style={s.item}>
          <Text style={[s.text, isSelected && s.textSelected]}>{value}</Text>
        </View>
      );
    },
    [selectedValue]
  );

  return (
    <View style={s.wrap}>
      <View style={s.selector} pointerEvents="none" />
      <FlatList
        ref={ref}
        data={HOURS_KEYS}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={() => {}}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        windowSize={5}
        maxToRenderPerBatch={20}
        initialNumToRender={VISIBLE + 4}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    height: ITEM_HEIGHT * VISIBLE,
    overflow: 'hidden',
    width: 100,
    position: 'relative',
  },
  selector: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  textSelected: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.accent,
  },
});

export default function TimePicker({ value, onChange, visible, onClose }) {
  const parsed = parseHour(value);
  const [selHour, setSelHour] = useState(parsed.hour);
  const [selPeriod, setSelPeriod] = useState(parsed.period);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const next = parseHour(value);
    setSelHour(next.hour);
    setSelPeriod(next.period);
  }, [value, visible]);

  const handleConfirm = () => {
    onChange(buildTimeString(selHour, selPeriod));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Seleccionar hora</Text>

          <View style={styles.pickerRow}>
            <Drum selectedValue={selHour} onSelect={setSelHour} />
            <Text style={styles.fixedMinutes}>:00</Text>
            <View style={styles.ampmCol}>
              <TouchableOpacity
                style={[styles.ampmBtn, selPeriod === 'AM' && styles.ampmActive]}
                onPress={() => setSelPeriod('AM')}
              >
                <Text style={[styles.ampmText, selPeriod === 'AM' && styles.ampmTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ampmBtn, selPeriod === 'PM' && styles.ampmActive]}
                onPress={() => setSelPeriod('PM')}
              >
                <Text style={[styles.ampmText, selPeriod === 'PM' && styles.ampmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirm}>
              <Text style={styles.btnConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.surface,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surface,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginVertical: 16,
  },
  fixedMinutes: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  ampmCol: {
    alignItems: 'center',
    gap: 8,
  },
  ampmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  ampmActive: {
    backgroundColor: COLORS.accent,
  },
  ampmText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  ampmTextActive: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
    alignItems: 'center',
  },
  btnCancelText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
