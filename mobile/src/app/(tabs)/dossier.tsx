import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { apiRequest, type ApiPass } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { PressableScale } from '../../components/PressableScale'
import { SkeletonRow } from '../../components/Skeleton'
import { COLORS } from '../../config'

const KINDS = [
  {
    id: 'identity' as const,
    title: 'Pièce d’identité',
    description: 'CIP ou passeport en cours de validité',
  },
  {
    id: 'income' as const,
    title: 'Preuves de revenus',
    description: 'Bulletins de salaire, attestation ou relevés',
  },
]

const STATUS_LABELS: Record<string, { label: string; color: string; background: string }> = {
  pending: { label: 'À vérifier', color: COLORS.warning, background: '#fef3c7' },
  approved: { label: 'Vérifié', color: COLORS.success, background: '#dcfce7' },
  rejected: { label: 'Rejeté', color: COLORS.danger, background: '#fee2e2' },
}

export default function DossierScreen() {
  const { token, requireAuth, refreshUser } = useAuth()
  const [pass, setPass] = useState<ApiPass | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!requireAuth('/(tabs)/dossier')) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setPass(await apiRequest<ApiPass>('/api/me/pass', { token }))
    } catch {
      setPass(null)
    } finally {
      setLoading(false)
    }
  }, [requireAuth, token])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const upload = useCallback(async (kind: 'identity' | 'income') => {
    const selection = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      multiple: false,
    })
    if (selection.canceled || selection.assets.length === 0) return
    const asset = selection.assets[0]
    setBusy(kind)
    try {
      const form = new FormData()
      form.append('file', { uri: asset.uri, name: asset.name || 'document', type: asset.mimeType || 'application/pdf' } as never)
      await apiRequest('/api/me/documents?kind=' + kind, { method: 'POST', body: form, token })
      await load()
      await refreshUser()
    } catch {
      // erreur silencieuse : l'écran se rafraîchit depuis /api/me/pass
    } finally {
      setBusy(null)
    }
  }, [token, load, refreshUser])

  const remove = useCallback(async (id: string) => {
    try {
      await apiRequest('/api/me/documents/' + id, { method: 'DELETE', token })
      await load()
      await refreshUser()
    } catch {
      // silence volontaire, l'écran se rafraîchit
    }
  }, [token, load, refreshUser])

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <SkeletonRow showStatusChip />
        <SkeletonRow showStatusChip />
      </ScrollView>
    )
  }

  const completion = pass?.completionPercent ?? 0
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Animated.View entering={FadeInDown.duration(380)} style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Complétude du dossier</Text>
          <Text style={styles.progressValue}>{completion}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          Vos fichiers sont accessibles uniquement depuis votre compte et nos équipes de vérification.
        </Text>
      </Animated.View>

      {KINDS.map((kind) => {
        const related = (pass?.documents ?? []).filter((item) => item.kind === kind.id)
        return (
          <View key={kind.id} style={styles.card}>
            <Text style={styles.cardTitle}>{kind.title}</Text>
            <Text style={styles.cardDescription}>{kind.description}</Text>
            <PressableScale
              style={[styles.upload, busy === kind.id && styles.uploadDisabled]}
              disabled={busy !== null}
              onPress={() => void upload(kind.id)}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
              <Text style={styles.uploadText}>
                {busy === kind.id ? 'Envoi…' : related.length ? 'Remplacer' : 'Ajouter un fichier'}
              </Text>
            </PressableScale>
            {related.map((document) => {
              const status = STATUS_LABELS[document.status] ?? STATUS_LABELS.pending
              return (
                <View key={document.id} style={styles.documentRow}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.documentName} numberOfLines={1}>{document.label}</Text>
                  <View style={[styles.statusChip, { backgroundColor: status.background }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Pressable onPress={() => void remove(document.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                  </Pressable>
                </View>
              )
            })}
          </View>
        )
      })}

      {pass?.isReady && (
        <View style={styles.ready}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.readyText}>Votre dossier est complet.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 12, gap: 12, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progressCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  progressValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: COLORS.slate100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.primary },
  progressHint: { marginTop: 10, fontSize: 12, color: COLORS.slate500 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  cardDescription: { fontSize: 13, color: COLORS.slate500 },
  upload: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12,
  },
  uploadDisabled: { opacity: 0.6 },
  uploadText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  documentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.slate100, borderRadius: 10, padding: 10, marginTop: 4,
  },
  documentName: { flex: 1, fontSize: 13, color: COLORS.slate900 },
  statusChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  readyText: { color: COLORS.success, fontSize: 14, fontWeight: '600' },
})
