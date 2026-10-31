import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiRequest, type ApiApartment } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { ApartmentCard } from '../../components/ApartmentCard'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { PressableScale } from '../../components/PressableScale'
import { COLORS } from '../../config'

const TYPE_FILTERS = [
  { value: 'all', label: 'Tout' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Chambre' },
  { value: 'house', label: 'Maison' },
  { value: 'loft', label: 'Loft' },
]

export default function ListingsScreen() {
  const { user, token } = useAuth()
  const searchParams = useLocalSearchParams<{ q?: string }>()
  const router = useRouter()
  const [listings, setListings] = useState<ApiApartment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchCity, setSearchCity] = useState(typeof searchParams.q === 'string' ? searchParams.q : '')
  const [propertyType, setPropertyType] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '60' })
    if (searchCity.trim()) params.set('city', searchCity.trim())
    if (propertyType !== 'all') params.set('type', propertyType)
    try {
      const items = await apiRequest<ApiApartment[]>('/api/apartments?' + params.toString(), { token })
      setListings(Array.isArray(items) ? items : [])
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [searchCity, propertyType, token])

  useEffect(() => {
    // report différé : évite setState synchrone dans le corps de l'effet
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await load().finally(() => setRefreshing(false))
  }, [load])

  const isVisitor = useMemo(() => !token, [token])

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.slate500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ville, quartier… (Cotonou, Calavi…)"
          value={searchCity}
          onChangeText={setSearchCity}
          returnKeyType="search"
          onSubmitEditing={() => void load()}
        />
      </View>

      <View style={styles.chips}>
        {TYPE_FILTERS.map((filter) => (
          <PressableScale
            key={filter.value}
            style={[styles.chip, propertyType === filter.value && styles.chipActive]}
            onPress={() => setPropertyType(filter.value)}
          >
            <Text style={[styles.chipText, propertyType === filter.value && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {isVisitor && (
        <PressableScale style={styles.visitorNotice} onPress={() => router.push('/auth?redirect=%2F')}>
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.primary} />
          <Text style={styles.visitorNoticeText}>
            Visiteur : aperçu limité. Connectez-vous pour voir toutes les annonces.
          </Text>
        </PressableScale>
      )}

      {loading ? (
        <SkeletonList />
      ) : listings.length === 0 ? (
        <EmptyState variant="search" />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          renderItem={({ item, index }) => (
            <ApartmentCard apartment={item} index={index} />
          )}
          ListFooterComponent={
            <Text style={styles.footer}>{listings.length} annonces disponibles{user ? '' : ' (aperçu visiteur)'}</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, marginHorizontal: 12, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.slate200,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.slate900 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.slate200,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.slate500 },
  chipTextActive: { color: COLORS.white },
  visitorNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 12, marginBottom: 6, padding: 10,
    backgroundColor: '#e0f2fe', borderRadius: 10,
  },
  visitorNoticeText: { flex: 1, fontSize: 12, color: COLORS.primaryDark, fontWeight: '500' },
  list: { padding: 12, gap: 12 },
  footer: { textAlign: 'center', color: COLORS.slate400, fontSize: 12, paddingVertical: 12 },
})
