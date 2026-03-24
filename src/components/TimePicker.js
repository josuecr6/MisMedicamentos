import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS } from '../utils/theme';

const ITEM_HEIGHT   = 56;
const VISIBLE_ITEMS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2); // 2 items arriba/abajo

const HOURS_LIST   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function parseTime(val) {
  if (!val) return { hour: '08', minute: '00', period: 'AM' };
  const [timePart = '08:00', period = 'AM'] = val.split(' ');
  const [h = '08', m = '00'] = timePart.split(':');
  const minuteNum = Math.round(parseInt(m, 10) / 5) * 5;
  const minute    = String(minuteNum >= 60 ? 0 : minuteNum).padStart(2, '0');
  return { hour: h.padStart(2, '0'), minute, period };
}

export function buildTimeString(hour, minute, period) {
  return `${hour}:${minute} ${period}`;
}

// ─── Drum ────────────────────────────────────────────────────────────────────
// Usa ScrollView simple sobre una lista FINITA.
// El prop `resetKey` cambia cuando el modal abre, forzando remontaje
// completo y eliminando cualquier posición residual de sesiones anteriores.
function Drum({ items, selectedValue, onSelect, resetKey }) {
  const scrollRef    = useRef(null);
  const selectedIndex = Math.max(0, items.indexOf(selectedValue));

  // Scroll al valor correcto cada vez que el modal se abre (resetKey cambia)
  useEffect(() => {
    const offset = selectedIndex * ITEM_HEIGHT;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [resetKey, selectedIndex]);

  const snapToNearest = useCallback(
    (offsetY) => {
      const index         = Math.max(0, Math.min(Math.round(offsetY / ITEM_HEIGHT), items.length - 1));
      const snappedOffset = index * ITEM_HEIGHT;
      scrollRef.current?.scrollTo({ y: snappedOffset, animated: true });
      onSelect(items[index]);
    },
    [items, onSelect]
  );

  const onScrollEndDrag = useCallback(
    (e) => snapToNearest(e.nativeEvent.contentOffset.y),
    [snapToNearest]
  );

  const onMomentumScrollEnd = useCallback(
    (e) => snapToNearest(e.nativeEvent.contentOffset.y),
    [snapToNearest]
  );

  return (
    <View style={s.drumWrapper}>
      {/* Highlight del ítem central — encima del scroll para que se vea */}
      <View style={s.highlight} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PADDING_ITEMS }}
      >
        {items.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <View key={item} style={s.item}>
              <Text style={[s.text, isSelected && s.textSelected]}>{item}</Text>
            </View>
          );
        })}
      </ScrollView>
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
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * PADDING_ITEMS,
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

// ─── TimePicker ──────────────────────────────────────────────────────────────
export default function TimePicker({ value, onChange, visible, onClose }) {
  const [selHour,   setSelHour]   = useState('08');
  const [selMinute, setSelMinute] = useState('00');
  const [selPeriod, setSelPeriod] = useState('AM');
  const [resetKey,  setResetKey]  = useState(0);

  // Cuando el modal se abre: parsea el valor nuevo y reinicia los drums
  useEffect(() => {
    if (!visible) return;
    const { hour, minute, period } = parseTime(value);
    setSelHour(hour);
    setSelMinute(minute);
    setSelPeriod(period);
    // Incrementar resetKey fuerza remontaje de los Drum con el valor correcto
    setResetKey((k) => k + 1);
  }, [visible]); // solo reacciona a visible, no a value

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
            {/* key cambia con resetKey → remonta el Drum completamente */}
            <Drum
              key={`hour-${resetKey}`}
              items={HOURS_LIST}
              selectedValue={selHour}
              onSelect={setSelHour}
              resetKey={resetKey}
            />

            <Text style={styles.separator}>:</Text>

            <Drum
              key={`min-${resetKey}`}
              items={MINUTES_LIST}
              selectedValue={selMinute}
              onSelect={setSelMinute}
              resetKey={resetKey}
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
