import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import { apiRequest, type ApiMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { PressableScale } from '../../components/PressableScale'
import { COLORS } from '../../config'

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id: string; otherUserName?: string }>()
  const conversationId = String(params.id)
  const { token, user, isLoading } = useAuth()
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const listRef = useRef<FlatList<ApiMessage>>(null)

  const load = useCallback(async () => {
    try {
      const items = await apiRequest<ApiMessage[]>('/api/conversations/' + conversationId + '/messages', { token })
      setMessages(Array.isArray(items) ? items : [])
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [conversationId, token])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => {
    const interval = setInterval(() => { void load() }, 8000)
    return () => clearInterval(interval)
  }, [load])

  const send = useCallback(async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    try {
      await apiRequest<ApiMessage>('/api/messages', {
        method: 'POST',
        token,
        body: { conversationId, content },
      })
      setDraft('')
      await load()
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120)
    } catch {
      // silencieux : le prochain rafraîchissement réessaie
    } finally {
      setSending(false)
    }
  }, [conversationId, draft, sending, token, load])

  if (isLoading || !user) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={44} color={COLORS.slate400} />
          <Text style={styles.emptyTitle}>Démarrez la conversation</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.senderId === user.id
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubblePeer]}>
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>{item.content}</Text>
                <Text style={mine ? styles.timeMine : styles.time}>
                  {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )
          }}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Écrivez votre message…"
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <PressableScale
          style={[styles.send, (sending || !draft.trim()) && styles.sendDisabled]}
          disabled={sending || !draft.trim()}
          onPress={() => void send()}
          accessibilityLabel="Envoyer le message"
          scaleTo={0.88}
        >
          <Ionicons name="send" size={18} color={COLORS.white} />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.slate500 },
  list: { padding: 12, gap: 6 },
  bubble: {
    maxWidth: '80%', borderRadius: 18, paddingVertical: 9, paddingHorizontal: 13,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 6 },
  bubblePeer: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 14, color: COLORS.slate900 },
  bubbleTextMine: { fontSize: 14, color: COLORS.white },
  time: { fontSize: 10, color: COLORS.slate400, marginTop: 3, alignSelf: 'flex-end' },
  timeMine: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.slate200,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.slate900,
    maxHeight: 110,
  },
  send: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
})
