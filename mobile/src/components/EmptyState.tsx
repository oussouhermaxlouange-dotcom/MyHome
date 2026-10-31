import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, FadeInDown,
} from 'react-native-reanimated'
import { COLORS } from '../config'

export type EmptyVariant = 'search' | 'heart' | 'chat' | 'folder' | 'error'

const ILLUSTRATIONS: Record<EmptyVariant, { title: string; hint: string }> = {
  search: { title: 'Aucune annonce trouvée', hint: "Élargissez vos critères ou revenez plus tard, de nouveaux logements arrivent chaque semaine." },
  heart: { title: 'Aucun favori', hint: "Touchez le cœur sur une annonce pour la retrouver ici." },
  chat: { title: 'Aucune conversation', hint: "Contactez un bailleur depuis une annonce pour démarrer la discussion." },
  folder: { title: 'Aucune candidature', hint: "Candidatez depuis la fiche d'une annonce disponible." },
  error: { title: 'Oups, une erreur', hint: "Une erreur est survenue. Rechargez pour réessayer." },
}

function HouseIllustration() {
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130" accessible accessibilityLabel="Illustration d'une maison">
      <Circle cx={34} cy={34} r={5} fill={COLORS.primary} opacity={0.25} />
      <Circle cx={122} cy={22} r={8} fill="#7dd3fc" opacity={0.4} />
      <Circle cx={134} cy={104} r={5} fill="#fbbf24" opacity={0.5} />
      <Rect x={28} y={55} width={94} height={58} rx={8} fill="#ffffff" stroke={COLORS.primary} strokeWidth={3} />
      <Path d="M22 58 L75 20 L128 58" stroke={COLORS.primary} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Rect x={64} y={82} width={22} height={31} rx={3} fill={COLORS.primary} opacity={0.85} />
      <Rect x={40} y={66} width={16} height={13} rx={3} fill="#7dd3fc" />
      <Rect x={94} y={66} width={16} height={13} rx={3} fill="#7dd3fc" />
      <Circle cx={75} cy={112} r={3} fill={COLORS.primary} opacity={0.4} />
    </Svg>
  )
}

function HeartIllustration() {
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130">
      <Circle cx={36} cy={30} r={5} fill={COLORS.danger} opacity={0.25} />
      <Circle cx={126} cy={98} r={7} fill="#fda4af" opacity={0.45} />
      <Path
        d="M75 104 C 40 80 22 62 22 44 C 22 30 33 22 45 22 C 56 22 66 28 75 40 C 84 28 94 22 105 22 C 117 22 128 30 128 44 C 128 62 110 80 75 104 Z"
        fill="#fecdd3"
        stroke="#fb7185"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Circle cx={56} cy={44} r={4.5} fill="#fb7185" />
      <Circle cx={54} cy={46} r={1.6} fill="#ffffff" />
    </Svg>
  )
}

function ChatIllustration() {
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130">
      <Circle cx={122} cy={30} r={5} fill={COLORS.primary} opacity={0.3} />
      <Circle cx={26} cy={100} r={4} fill="#7dd3fc" opacity={0.5} />
      <Path d="M18 42 a14 14 0 0 1 14-14 h48 a14 14 0 0 1 14 14 v22 a14 14 0 0 1-14 14 H54 l-14 12 v-12 h-8 a14 14 0 0 1-14-14 Z" fill="#ffffff" stroke={COLORS.primary} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={32} y={44} width={46} height={5} rx={2.5} fill="#7dd3fc" />
      <Rect x={32} y={54} width={30} height={5} rx={2.5} fill="#bae6fd" />
      <Path d="M96 66 a12 12 0 0 1 12-12 h20 a12 12 0 0 1 12 12 v14 a12 12 0 0 1-12 12 h-6 l7 10 -16-10 h-5 a12 12 0 0 1-12-12 Z" fill={COLORS.primary} opacity={0.9} />
      <Circle cx={112} cy={72} r={2.5} fill="#ffffff" />
      <Circle cx={121} cy={72} r={2.5} fill="#ffffff" />
      <Circle cx={130} cy={72} r={2.5} fill="#ffffff" />
    </Svg>
  )
}

function FolderIllustration() {
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130">
      <Circle cx={30} cy={26} r={5} fill={COLORS.success} opacity={0.3} />
      <Circle cx={130} cy={104} r={6} fill="#86efac" opacity={0.4} />
      <Path d="M30 40 a8 8 0 0 1 8-8 h24 l10 10 h40 a8 8 0 0 1 8 8 v52 a8 8 0 0 1-8 8 H38 a8 8 0 0 1-8-8 Z" fill="#ffffff" stroke={COLORS.success} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M30 58 h90 v44 a8 8 0 0 1-8 8 H38 a8 8 0 0 1-8-8 Z" fill="#dcfce7" opacity={0.75} />
      <Rect x={48} y={72} width={28} height={22} rx={4} fill="#ffffff" stroke={COLORS.success} strokeWidth={2.5} />
      <Path d="M52 80 l6 6 12-12" stroke={COLORS.success} strokeWidth={3} strokeLinecap="round" fill="none" />
    </Svg>
  )
}

function ErrorIllustration() {
  return (
    <Svg width={150} height={130} viewBox="0 0 150 130">
      <Circle cx={120} cy={28} r={6} fill={COLORS.danger} opacity={0.25} />
      <Circle cx={124} cy={100} r={4} fill={COLORS.warning} opacity={0.4} />
      <Rect x={64} y={18} width={22} height={94} rx={11} fill="#fecaca" stroke={COLORS.danger} strokeWidth={3} />
      <Rect x={70} y={46} width={10} height={34} rx={5} fill={COLORS.danger} />
      <Circle cx={75} cy={92} r={5.5} fill={COLORS.danger} />
    </Svg>
  )
}

const VARY: Record<EmptyVariant, () => React.ReactNode> = {
  search: HouseIllustration,
  heart: HeartIllustration,
  chat: ChatIllustration,
  folder: FolderIllustration,
  error: ErrorIllustration,
}

interface Props {
  variant: EmptyVariant
  title?: string
  hint?: string
  action?: { label: string; onPress: () => void }
}

/** État vide avec illustration SVG animée (flottement doux) et entrée progressive. */
export function EmptyState({ variant, title, hint, action }: Props) {
  const copy = ILLUSTRATIONS[variant]
  const Illustration = VARY[variant]
  const float = useSharedValue(0)

  useEffect(() => {
    float.value = withRepeat(
      withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [float])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }))

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify().damping(16)} style={floatStyle}>
        <Illustration />
      </Animated.View>
      <Text style={styles.title}>{title ?? copy.title}</Text>
      <Text style={styles.hint}>{hint ?? copy.hint}</Text>
      {action && (
        <Text style={styles.linkLabel} onPress={action.onPress} accessibilityRole="link">
          {action.label}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.slate900, textAlign: 'center' },
  hint: { fontSize: 13, color: COLORS.slate500, textAlign: 'center', lineHeight: 19, maxWidth: 300 },
  linkLabel: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 6 },
})
