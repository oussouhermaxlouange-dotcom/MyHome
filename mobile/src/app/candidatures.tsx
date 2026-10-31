import { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { apiRequest, STATUS_LABELS, type ApiApartment, type ApiApplication } from '../lib/api'
import { useAuth } from '../lib/auth'
import { EmptyState } from '../components/EmptyState'
import { SkeletonRow } from '../components/Skeleton'
import { COLORS } from '../config'

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  pending: { background: '#fef3c7', color: COLORS.warning },
  pre_validated: { background: '#e0f2fe', color: COLORS.primaryDark },
  accepted: { background: '#dcfce7', color: COLORS.success },
  rejected: { background: '#fee2e2', color: COLORS.danger },
}

export default function ApplicationsScreen() {
  const { token, requireAuth } = useAuth()
  const [applications, setApplications] = useState<ApiApplication[]>([])
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!requireAuth('/candidatures')) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [items, apartments] = await Promise.all([
        apiRequest<ApiApplication[]>('/api/me/applications', { token }),
        apiRequest<ApiApartment[]>('/api/me/apartments', { token }).catch(() => [] as ApiApartment[]),
      ])
      const catalog = await apiRequest<ApiApartment[]>('/api/apartments?limit=100', { token }).catch(() => [] as ApiApartment[])
      const map: Record<string, string> = {}
      for (const apartment of [...apartments, ...catalog]) map[apartment.id] = apartment.title
      setApplications(Array.isArray(items) ? items : [])
      setTitles(map)
    } catch {
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [requireAuth, token])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          {[0, 1, 2].map((key) => <SkeletonRow key={key} showStatusChip />)}
        </View>
      </View>
    )
  }

  if (applications.length === 0) {
    return <EmptyState variant="folder" />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const color = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending
          const scoreColor = item.solvabilityScore === 'green' ? COLORS.success
            : item.solvabilityScore === 'orange' ? COLORS.warning : COLORS.danger
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 8) * 70).duration(380).springify().damping(17)}
              style={styles.card}
            >
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{titles[item.apartmentId] ?? 'Logement'}</Text>
                  <Text style={styles.date}>
                    Envoyée le {new Date(item.submittedAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: color.background }]}>
                  <Text style={[styles.statusText, { color: color.color }]}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.bottomRow}>
                <View style={[styles.scoreDot, { backgroundColor: scoreColor }]} />
                <Text style={styles.scoreText}>
                  Solvabilité {item.solvabilityScore === 'green' ? 'solide' : item.solvabilityScore === 'orange' ? 'moyenne' : 'faible'}
                  {' · ratio '}{item.solvabilityRatio.toFixed(1)}
                </Text>
                <Text style={styles.completion}>Dossier {item.fileCompletionPercent}%</Text>
              </View>
              {Boolean(item.message) && <Text style={styles.message} numberOfLines={2}>« {item.message} »</Text>}
            </Animated.View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  date: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  scoreText: { flex: 1, fontSize: 13, color: COLORS.slate600 },
  completion: { fontSize: 12, color: COLORS.slate400 },
  message: { fontSize: 13, color: COLORS.slate500, fontStyle: 'italic' },
})
