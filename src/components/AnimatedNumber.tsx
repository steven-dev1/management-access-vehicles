import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
  format?: (n: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  style,
  format = (n) => String(n),
}) => {
  const displayValue = useSharedValue(0);
  const currentValue = useRef(0);

  useEffect(() => {
    const start = currentValue.current;
    const diff = value - start;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayValue.value = Math.round(start + diff * eased);
      currentValue.current = displayValue.value;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  return (
    <Animated.Text style={[styles.text, style, animatedStyle]}>
      {format(value)}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});
