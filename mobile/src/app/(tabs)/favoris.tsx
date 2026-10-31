import { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { apiRequest, type ApiApartment } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { ApartmentCard } from '../../components/ApartmentCard'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { COLORS } from '../../config'

export default function FavoritesScreen() {
  const { token, requireAuth } = useAuth()
  const [favorites, setFavorites] = useState<ApiApartment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!requireAuth('/(tabs)/favoris')) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [ids, all] = await Promise.all([
        apiRequest<string[]>('/api/me/favorites', { token }),
        apiRequest<ApiApartment[]>('/api/apartments?limit=100', { token }),
      ])
      const idSet = new Set(ids)
      setFavorites(all.filter((item) => idSet.has(item.id)))
    } catch {
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [requireAuth, token])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <View style={styles.container}>
      {loading ? (
        <SkeletonList count={3} />
      ) : favorites.length === 0 ? (
        <EmptyState variant="heart" />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <ApartmentCard apartment={item} index={index} />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, gap: 12 },
})
