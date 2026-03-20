import { StyleSheet } from 'react-native';
import { COLORS } from './theme';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 40,
    marginBottom: 24
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: COLORS.secondary,
    color: COLORS.text
  },
  inputDisabled: {
    color: COLORS.textMuted
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32
  },
  deleteButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.secondary
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 16
  }
});