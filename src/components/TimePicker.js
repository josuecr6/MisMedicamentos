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

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const REPEAT = 100;
const PADDING_ITEMS = 2;
const SPACER_HEIGHT = ITEM_HEIGHT * PADDING_ITEMS;

const HOURS_BASE = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES_BASE = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function buildList(base) {
  const arr = [];
  for (let r = 0; r < REPEAT; r++) {
    for (let i = 0; i < base.length; i++) {
      arr.push(`${r}-${i}`);
    }
  }
  return arr;
}

const HOURS_KEYS = buildList(HOURS_BASE);
const MINUTES_KEYS = buildList(MINUTES_BASE);

function getCenterIndex(base, value) {
  const idx = base.indexOf(value);
  const safeIdx = idx >= 0 ? idx : 0;
  return Math.floor(REPEAT / 2) * base.length + safeIdx;
}

function getScrollOffset(index) {
  return index * ITEM_HEIGHT;
}

function parseTime(val) {
  if (!val) return { hour: '08', minute: '00', period: 'AM' };
  const parts = val.split(' ');
  const period = parts[1] || 'AM';
  const timeParts = (parts[0] || '08:00').split(':');
  const hour = timeParts[0] || '08';
  const rawMinute = timeParts[1] || '00';
  const minuteNum = Math.round(parseInt(rawMinute, 10) / 5) * 5;
  const minute = String(minuteNum >= 60 ? 0 : minuteNum).padStart(2, '0');
  return { hour, minute, period };
}

export function buildTimeString(hour, minute, period) {
  return `${hour}:${minute} ${period}`;
}

const Spacer = () => <View style={{ height: SPACER_HEIGHT }} />;

function Drum({ base, keys, selectedValue, onSelect }) {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const currentIndex = useRef(getCenterIndex(base, selectedValue));

  // Scroll al índice correcto cuando se monta o cambia selectedValue externamente
  useEffect(() => {
    const index = getCenterIndex(base, selectedValue);
    currentIndex.current = index;
    const offset = getScrollOffset(index);
    const timer = setTimeout(() => {
      ref.current?.scrollToOffset({ offset, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const snapToIndex = useCallback(
    (rawOffset) => {
      // Calcula el índice más cercano al offset actual
      const index = Math.round(rawOffset / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, index);

      // Calcula el valor en base al módulo
      const mod = ((clampedIndex % base.length) + base.length) % base.length;
      const value = base[mod];

      // Snap al offset exacto para evitar que quede a medio camino
      const snappedOffset = getScrollOffset(clampedIndex);
      ref.current?.scrollToOffset({ offset: snappedOffset, animated: true });

      currentIndex.current = clampedIndex;
      onSelect(value);
    },
    [base, onSelect]
  );

  const onScrollBeginDrag = useCallback(() => {
    isDragging.current = true;
  }, []);

  const onScrollEndDrag = useCallback(
    (e) => {
      isDragging.current = false;
      snapToIndex(e.nativeEvent.contentOffset.y);
    },
    [snapToIndex]
  );

  const onMomentumScrollEnd = useCallback(
    (e) => {
      if (!isDragging.current) {
        snapToIndex(e.nativeEvent.contentOffset.y);
      }
    },
    [snapToIndex]
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: ITEM_HEIGHT,
      offset: SPACER_HEIGHT + ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ index }) => {
      const mod = ((index % base.length) + base.length) % base.length;
      const value = base[mod];
      const isSelected = value === selectedValue;
      return (
        <View style={s.item}>
          <Text style={[s.text, isSelected && s.textSelected]}>{value}</Text>
        </View>
      );
    },
    [base, selectedValue]
  );

  return (
    <View style={s.drumWrapper}>
      <View style={s.selectorBackground} pointerEvents="none" />
      <FlatList
        ref={ref}
        data={keys}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={() => {}}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        windowSize={7}
        maxToRenderPerBatch={20}
        initialNumToRender={VISIBLE_ITEMS + 4}
        removeClippedSubviews={false}
        ListHeaderComponent={<Spacer />}
        ListFooterComponent={<Spacer />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  drumWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 84,
    overflow: 'hidden',
    position: 'relative',
  },
  selectorBackground: {
    position: 'absolute',
    top: ITEM_HEIGHT * PADDING_ITEMS,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 22,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  textSelected: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent,
  },
});

export default function TimePicker({ value, onChange, visible, onClose }) {
  const parsed = parseTime(value);
  const [selHour, setSelHour] = useState(parsed.hour);
  const [selMinute, setSelMinute] = useState(parsed.minute);
  const [selPeriod, setSelPeriod] = useState(parsed.period);

  useEffect(() => {
    if (!visible) return;
    const next = parseTime(value);
    setSelHour(next.hour);
    setSelMinute(next.minute);
    setSelPeriod(next.period);
  }, [value, visible]);

  const handleConfirm = () => {
    onChange(buildTimeString(selHour, selMinute, selPeriod));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Seleccionar hora</Text>

          <View style={styles.pickerRow}>
            <Drum
              base={HOURS_BASE}
              keys={HOURS_KEYS}
              selectedValue={selHour}
              onSelect={setSelHour}
            />

            <Text style={styles.separator}>:</Text>

            <Drum
              base={MINUTES_BASE}
              keys={MINUTES_KEYS}
              selectedValue={selMinute}
              onSelect={setSelMinute}
            />

            <View style={styles.ampmCol}>
              <TouchableOpacity
                style={[styles.ampmBtn, selPeriod === 'AM' && styles.ampmActive]}
                onPress={() => setSelPeriod('AM')}
              >
                <Text style={[styles.ampmText, selPeriod === 'AM' && styles.ampmTextActive]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ampmBtn, selPeriod === 'PM' && styles.ampmActive]}
                onPress={() => setSelPeriod('PM')}
              >
                <Text style={[styles.ampmText, selPeriod === 'PM' && styles.ampmTextActive]}>
                  PM
                </Text>
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
    gap: 8,
    marginVertical: 16,
  },
  separator: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  ampmCol: {
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  ampmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  ampmActive: {
    backgroundColor: COLORS.accent,
  },
  ampmText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 14,
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
