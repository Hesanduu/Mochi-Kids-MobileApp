import { View, type ViewStyle } from 'react-native';

export type Dot = {
  size: number;
  color: string;
  opacity?: number;
  // Position inside the parent (the parent should have position: 'relative').
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

// Small decorative circles scattered on header panels.
// They're purely visual, so screen readers skip them.
export function Dots({ dots }: { dots: Dot[] }) {
  return (
    <>
      {dots.map((dot, i) => {
        const style: ViewStyle = {
          position: 'absolute',
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size / 2,
          backgroundColor: dot.color,
          opacity: dot.opacity ?? 1,
          top: dot.top,
          bottom: dot.bottom,
          left: dot.left,
          right: dot.right,
        };
        return <View key={i} style={style} importantForAccessibility="no" accessibilityElementsHidden />;
      })}
    </>
  );
}
