/**
 * TimePicker — Material Design 2, reloj analógico
 *
 * Comportamiento fiel al spec:
 *  1. Se abre mostrando el cuadrante de HORAS.
 *  2. Al soltar el dedo (o confirmar la hora) pasa automáticamente a MINUTOS.
 *  3. Las horas/minutos del header son tocables para volver al cuadrante.
 *  4. AM / PM se cambia tocando el botón correspondiente.
 *  5. Botones "Cancelar" y "Aceptar" al pie.
 *
 * Dependencias: react-native-svg (ya incluida en el proyecto).
 * Sin librerías externas adicionales.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  PanResponder,
} from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../utils/theme';

// ─── Constantes del reloj ─────────────────────────────────────────────────────
const CLOCK_SIZE   = 256;          // diámetro total del SVG
const CX           = CLOCK_SIZE / 2;
const CY           = CLOCK_SIZE / 2;
const R_FACE       = CX - 4;      // radio de la esfera
const R_NUMBERS    = CX - 32;     // radio donde van los números
const R_TIP        = CX - 28;     // longitud de la manecilla
const TIP_RADIUS   = 20;          // radio del círculo sobre el número activo
const HOUR_LABELS  = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_MARKS = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10…55

// ─── Utilidades ───────────────────────────────────────────────────────────────
function degToRad(deg) { return (deg * Math.PI) / 180; }

/** Ángulo en grados (0° = 12 en punto, crece en sentido horario) */
function angleFromCenter(x, y) {
  const dx = x - CX;
  const dy = y - CY;
  const raw = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  return ((raw % 360) + 360) % 360;
}

/** Coordenadas cartesianas de un punto en el cuadrante */
function polarToXY(angle, radius) {
  const rad = degToRad(angle);
  return { x: CX + radius * Math.sin(rad), y: CY - radius * Math.cos(rad) };
}

/** Parsea "08:00 AM" → { hour: 8, minute: 0, period: 'AM' } */
function parseTime(val = '') {
  const [timePart = '08:00', period = 'AM'] = val.split(' ');
  const [h = '8', m = '0'] = timePart.split(':');
  const minuteRaw = Math.round(parseInt(m, 10) / 5) * 5;
  return {
    hour:   parseInt(h, 10) || 8,
    minute: minuteRaw >= 60 ? 0 : minuteRaw,
    period,
  };
}

export function buildTimeString(hour, minute, period) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

// ─── Cuadrante analógico ──────────────────────────────────────────────────────
function ClockDial({ mode, hour, minute, onHourChange, onMinuteChange, onRelease }) {
  const svgRef = useRef(null);
  // Posición del layout del SVG (se mide con onLayout)
  const layoutRef = useRef({ x: 0, y: 0, width: CLOCK_SIZE, height: CLOCK_SIZE });

  // Ángulo activo de la manecilla
  const activeAngle = mode === 'hour'
    ? (hour % 12) * 30        // cada hora = 30°
    : minute * 6;             // cada minuto = 6°

  const tipPos = polarToXY(activeAngle, R_TIP);

  /**
   * Convierte coordenadas absolutas de pantalla a coordenadas internas del SVG
   * teniendo en cuenta la escala (el SVG puede estar escalado si la pantalla
   * es más pequeña que CLOCK_SIZE).
   */
  const screenToSVG = useCallback((pageX, pageY) => {
    const { x, y, width } = layoutRef.current;
    const scale = CLOCK_SIZE / width;        // factor de escala
    return {
      x: (pageX - x) * scale,
      y: (pageY - y) * scale,
    };
  }, []);

  const handleTouch = useCallback(
    (pageX, pageY) => {
      const { x, y } = screenToSVG(pageX, pageY);
      const angle = angleFromCenter(x, y);

      if (mode === 'hour') {
        let h = Math.round(angle / 30) % 12;
        if (h === 0) h = 12;
        onHourChange(h);
      } else {
        const min = Math.round(angle / 6) % 60;
        onMinuteChange(min);
      }
    },
    [mode, onHourChange, onMinuteChange, screenToSVG],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        handleTouch(pageX, pageY);
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        handleTouch(pageX, pageY);
      },
      onPanResponderRelease: () => {
        onRelease?.();
      },
    }),
  ).current;

  // Actualizar handleTouch en panResponder cuando cambia mode/hour/minute
  useEffect(() => {
    panResponder.panHandlers.onStartShouldSetPanResponder = () => true;
  });

  // Reconstruir panResponder cuando cambia el modo
  const panRef = useRef(null);
  panRef.current = { handleTouch, onRelease };

  const activePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => panRef.current.handleTouch(e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderMove:  (e) => panRef.current.handleTouch(e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderRelease: ()  => panRef.current.onRelease?.(),
    }),
  ).current;

  return (
    <View
      onLayout={(e) => {
        e.target.measure((fx, fy, w, h, px, py) => {
          layoutRef.current = { x: px, y: py, width: w, height: h };
        });
      }}
      style={styles.dialWrapper}
      {...activePan.panHandlers}
    >
      <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}>

        {/* Esfera */}
        <Circle cx={CX} cy={CY} r={R_FACE} fill={COLORS.secondary} />

        {/* Línea de la manecilla */}
        <Line
          x1={CX} y1={CY}
          x2={tipPos.x} y2={tipPos.y}
          stroke={COLORS.accent}
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Círculo activo sobre el número seleccionado */}
        <Circle cx={tipPos.x} cy={tipPos.y} r={TIP_RADIUS} fill={COLORS.accent} />

        {/* Números / marcas */}
        {mode === 'hour'
          ? HOUR_LABELS.map((h, i) => {
              const pos    = polarToXY(i * 30, R_NUMBERS);
              const active = h === hour;
              return (
                <G key={h}>
                  <SvgText
                    x={pos.x} y={pos.y}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fontSize={15}
                    fontWeight={active ? '600' : '400'}
                    fill={active ? '#ffffff' : COLORS.text}
                  >
                    {h}
                  </SvgText>
                </G>
              );
            })
          : MINUTE_MARKS.map((m, i) => {
              const pos    = polarToXY(i * 30, R_NUMBERS);
              const active = m === minute;
              const showNum = i % 3 === 0; // 0, 15, 30, 45 llevan número

              if (!showNum) {
                // Punto pequeño para los minutos intermedios
                return (
                  <Circle
                    key={m}
                    cx={pos.x} cy={pos.y}
                    r={active ? TIP_RADIUS : 3}
                    fill={active ? COLORS.accent : COLORS.textMuted}
                    opacity={active ? 1 : 0.5}
                  />
                );
              }

              return (
                <G key={m}>
                  <SvgText
                    x={pos.x} y={pos.y}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fontSize={14}
                    fontWeight={active ? '600' : '400'}
                    fill={active ? '#ffffff' : COLORS.text}
                  >
                    {String(m).padStart(2, '0')}
                  </SvgText>
                </G>
              );
            })
        }

        {/* Punto central */}
        <Circle cx={CX} cy={CY} r={5} fill={COLORS.accent} />

      </Svg>
    </View>
  );
}

// ─── TimePicker principal ─────────────────────────────────────────────────────
export default function TimePicker({ value, onChange, visible, onClose }) {
  const parsed = parseTime(value);
  const [hour,   setHour]   = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);
  const [mode,   setMode]   = useState('hour'); // 'hour' | 'min'

  // Sincronizar al abrir
  useEffect(() => {
    if (!visible) return;
    const next = parseTime(value);
    setHour(next.hour);
    setMinute(next.minute);
    setPeriod(next.period);
    setMode('hour'); // siempre empieza en horas
  }, [value, visible]);

  // Al soltar el dedo en modo hora → pasar automáticamente a minutos
  const handleDialRelease = useCallback(() => {
    if (mode === 'hour') setMode('min');
  }, [mode]);

  const handleConfirm = useCallback(() => {
    onChange(buildTimeString(hour, minute, period));
    onClose();
  }, [onChange, onClose, hour, minute, period]);

  const hourDisplay   = String(hour).padStart(2, '0');
  const minuteDisplay = String(minute).padStart(2, '0');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* ── Header de color (muestra hora seleccionada) ── */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>SELECCIONAR HORA</Text>

            <View style={styles.timeRow}>
              {/* Hora */}
              <TouchableOpacity
                style={[styles.timePart, mode === 'hour' && styles.timePartActive]}
                onPress={() => setMode('hour')}
                activeOpacity={0.7}
              >
                <Text style={styles.timeText}>{hourDisplay}</Text>
              </TouchableOpacity>

              <Text style={styles.timeSep}>:</Text>

              {/* Minuto */}
              <TouchableOpacity
                style={[styles.timePart, mode === 'min' && styles.timePartActive]}
                onPress={() => setMode('min')}
                activeOpacity={0.7}
              >
                <Text style={styles.timeText}>{minuteDisplay}</Text>
              </TouchableOpacity>

              {/* AM / PM */}
              <View style={styles.ampmCol}>
                <TouchableOpacity
                  style={[styles.ampmBtn, period === 'AM' && styles.ampmBtnActive]}
                  onPress={() => setPeriod('AM')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ampmText, period === 'AM' && styles.ampmTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, period === 'PM' && styles.ampmBtnActive]}
                  onPress={() => setPeriod('PM')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ampmText, period === 'PM' && styles.ampmTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Cuadrante analógico ── */}
          <View style={styles.dialArea}>
            <ClockDial
              mode={mode}
              hour={hour}
              minute={minute}
              onHourChange={setHour}
              onMinuteChange={setMinute}
              onRelease={handleDialRelease}
            />
          </View>

          {/* ── Botones ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOk} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.btnOkText}>Aceptar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 328,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },

  // Header
  header: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePart: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timePartActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '300',
    lineHeight: 60,
  },
  timeSep: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 52,
    fontWeight: '300',
    lineHeight: 60,
    marginHorizontal: 2,
  },
  ampmCol: {
    marginLeft: 10,
    alignSelf: 'center',
    gap: 4,
    flexDirection: 'column',
  },
  ampmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ampmBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'transparent',
  },
  ampmText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  ampmTextActive: {
    color: '#ffffff',
  },

  // Cuadrante
  dialArea: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.bgCard,
  },
  dialWrapper: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
  },

  // Botones
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
  },
  btnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnCancelText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  btnOk: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnOkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
