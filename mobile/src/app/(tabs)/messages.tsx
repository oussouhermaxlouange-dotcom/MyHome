import { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { apiRequest, type ApiConversation } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonRow } from '../../components/Skeleton'
import { PressableScale } from '../../components/PressableScale'
import { COLORS } from '../../config'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'maintenant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

export default function MessagesScreen() {
  const { user, token, requireAuth } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!requireAuth('/(tabs)/messages')) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const items = await apiRequest<ApiConversation[]>('/api/me/conversations', { token })
      setConversations(Array.isArray(items) ? items : [])
    } catch {
      setConversations([])
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
          {[0, 1, 2, 3].map((key) => <SkeletonRow key={key} />)}
        </View>
      </View>
    )
  }

  if (conversations.length === 0) {
    return <EmptyState variant="chat" />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 70).duration(380).springify().damping(17)}>
            <PressableScale
              style={styles.row}
              onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id } })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.otherUserName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.otherUserName}</Text>
                  <Text style={styles.time}>{timeAgo(item.lastTimestamp)}</Text>
                </View>
                <View style={styles.rowTop}>
                  <Text style={styles.preview} numberOfLines={2}>{item.lastMessage || 'Nouvelle conversation'}</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.rowTop}>
                  <Text style={styles.apartment} numberOfLines={1}>{item.apartmentTitle}</Text>
                  {user?.id === item.landlordId && <Text style={styles.role}>Bailleur</Text>}
                </View>
              </View>
            </PressableScale>
          </Animated.View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, gap: 10 },
  row: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f2fe',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  time: { fontSize: 11, color: COLORS.slate400 },
  preview: { flex: 1, fontSize: 13, color: COLORS.slate600, marginRight: 8 },
  badge: {
    backgroundColor: COLORS.primary, minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  apartment: { flex: 1, fontSize: 12, color: COLORS.slate400 },
  role: { fontSize: 11, color: COLORS.slate400, fontWeight: '600' },
})
