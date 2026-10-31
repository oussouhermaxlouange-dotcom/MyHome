import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface Props {
  onPress?: () => void
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  disabled?: boolean
  /** Échelle à l'appui ; 0.96 par défaut. 1 désactive l'effet. */
  scaleTo?: number
  accessibilityRole?: 'button' | 'header' | 'adjustable' | 'link' | 'search' | 'imagebutton' | 'summary'
  accessibilityLabel?: string
  testID?: string
}

/**
 * Pressable avec micro-interaction tactile : compression rapide à l'appui,
 * rebond élastique au relâchement (Reanimated, animé sur le thread UI).
 */
export function PressableScale({
  onPress,
  onLongPress,
  style,
  children,
  disabled,
  scaleTo = 0.96,
  accessibilityRole = 'button',
  accessibilityLabel,
  testID,
}: Props) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const spring = { damping: 18, stiffness: 320, mass: 0.6 }

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={disabled ? { disabled: true } : undefined}
      testID={testID}
      style={[style, animatedStyle]}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={scaleTo === 1 ? undefined : () => {
        // eslint-disable-next-line react-hooks/immutability -- les shared values Reanimated sont des refs mutables par conception
        scale.value = withSpring(scaleTo, { ...spring, damping: 26, stiffness: 500 })
      }}
      onPressOut={scaleTo === 1 ? undefined : () => {
        // eslint-disable-next-line react-hooks/immutability -- les shared values Reanimated sont des refs mutables par conception
        scale.value = withSpring(1, { damping: spring.damping, stiffness: spring.stiffness * 1.4, mass: spring.mass })
      }}
    >
      {children}
    </AnimatedPressable>
  )
}
