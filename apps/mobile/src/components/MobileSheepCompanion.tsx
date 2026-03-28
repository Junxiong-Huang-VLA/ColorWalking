import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

type CompanionPhase = "enter" | "idle" | "anticipate" | "revealing" | "happy" | "comfort";

type CompanionProps = {
  phase: CompanionPhase;
  colorName?: string;
};

const MESSAGE_POOL: Record<CompanionPhase, string[]> = {
  enter: ["小羊卷到场啦，今天也一起可可爱爱。"],
  idle: ["先深呼吸一下，我们慢慢来。", "我在你身边，准备好就点一下转盘。"],
  anticipate: ["搓搓小手，准备揭晓今天的幸运色。"],
  revealing: ["叮，颜色马上出现啦。", "小羊卷正在帮你把好运拆开。"],
  happy: ["这个颜色很衬你耶。", "收到今日好运啦。"],
  comfort: ["辛苦啦，今天也已经很棒。", "慢一点也没关系，我会一直陪你。"]
};

function pickMessage(pool: string[], recent: string[]): string {
  const candidates = pool.filter((item) => !recent.includes(item));
  const base = candidates.length ? candidates : pool;
  return base[Math.floor(Math.random() * base.length)];
}

export function MobileSheepCompanion({ phase, colorName }: CompanionProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [message, setMessage] = useState(MESSAGE_POOL.enter[0] ?? "小羊卷到场啦。");
  const recentMessages = useRef<string[]>([]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  useEffect(() => {
    const next = pickMessage(MESSAGE_POOL[phase], recentMessages.current);
    recentMessages.current = [...recentMessages.current.slice(-3), next];
    const suffix = phase === "happy" && colorName ? ` 今日色是${colorName}。` : "";
    setMessage(`${next}${suffix}`);
  }, [phase, colorName]);

  const bobStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -5]
          })
        },
        { scale: scaleAnim }
      ]
    }),
    [floatAnim, scaleAnim]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Animated.View style={bobStyle}>
          <Pressable
            style={styles.petShell}
            onPressIn={() => {
              Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true
              }).start();
            }}
          >
            <View style={styles.petHead}>
              <View style={styles.earLeft}><View style={styles.earInner} /></View>
              <View style={styles.earRight}><View style={styles.earInner} /></View>
              <View style={styles.eyeLeft}><View style={styles.eyeSpark} /></View>
              <View style={styles.eyeRightClosed} />
              <View style={styles.blushLeft} />
              <View style={styles.blushRight} />
              <View style={styles.nose} />
              <View style={styles.mouth} />
            </View>
            <View style={styles.scarf} />
            <View style={styles.tag} />
          </Pressable>
        </Animated.View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Q版小羊卷</Text>
        </View>
      </View>

      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 14
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  petShell: {
    width: 74,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#FFF9F3",
    borderWidth: 1,
    borderColor: "#F0E3D8",
    alignItems: "center",
    justifyContent: "center"
  },
  petHead: {
    width: 48,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE3D8",
    alignItems: "center",
    justifyContent: "center"
  },
  earLeft: {
    position: "absolute",
    left: -8,
    top: 10,
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: "#F5EDE0",
    alignItems: "center",
    justifyContent: "center"
  },
  earRight: {
    position: "absolute",
    right: -8,
    top: 10,
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: "#F5EDE0",
    alignItems: "center",
    justifyContent: "center"
  },
  earInner: {
    width: 6,
    height: 8,
    borderRadius: 3,
    backgroundColor: "#F7CBD6"
  },
  eyeLeft: {
    position: "absolute",
    left: 14,
    top: 16,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2A3A62",
    alignItems: "center",
    justifyContent: "center"
  },
  eyeSpark: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF"
  },
  eyeRightClosed: {
    position: "absolute",
    right: 12,
    top: 18,
    width: 9,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2A3A62"
  },
  blushLeft: {
    position: "absolute",
    left: 10,
    top: 25,
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F7B8C8"
  },
  blushRight: {
    position: "absolute",
    right: 10,
    top: 25,
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F7B8C8"
  },
  nose: {
    position: "absolute",
    top: 21,
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A3A62"
  },
  mouth: {
    position: "absolute",
    top: 26,
    width: 12,
    height: 7,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#2A3A62"
  },
  scarf: {
    position: "absolute",
    bottom: 12,
    width: 44,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#8FC4FF"
  },
  tag: {
    position: "absolute",
    bottom: 9,
    right: 16,
    width: 8,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#78C888"
  },
  badge: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#DDE9FF"
  },
  badgeText: {
    color: "#4F6890",
    fontSize: 12,
    fontWeight: "700"
  },
  bubble: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DEE8FA",
    backgroundColor: "#FBFDFF",
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  message: {
    color: "#445A82",
    fontSize: 14,
    lineHeight: 20
  }
});
