import { StyleSheet } from 'react-native';
import { COLORS } from './theme';

export const commonStyles = StyleSheet.create({

  // ── Contenedores ──────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },

  // ── Tipografía ────────────────────────────────────────────────
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 40,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 24,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSub,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Inputs ────────────────────────────────────────────────────
  input: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  inputDisabled: {
    color: COLORS.textMuted,
    opacity: 0.6,
  },

  // ── Botones ───────────────────────────────────────────────────
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Tarjetas ──────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  // ── Estados vacíos ────────────────────────────────────────────
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
});
