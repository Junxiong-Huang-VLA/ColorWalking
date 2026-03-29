import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { CHIBI_THEME } from "../../packages/chibi-ui/src";
import { FeaturesScreen } from "./src/screens/FeaturesScreen";
import { LuckyWheelScreen } from "./src/screens/LuckyWheelScreen";
import { OracleScreen } from "./src/screens/OracleScreen";
import { PetScreen } from "./src/screens/PetScreen";

type TabKey = "features" | "wheel" | "oracle" | "pet";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "features", label: "产品亮点" },
  { key: "wheel", label: "幸运转盘" },
  { key: "oracle", label: "时色签" },
  { key: "pet", label: "小羊卷" }
] as const;

export default function App() {
  const [tab, setTab] = useState<TabKey>("features");

  const subtitle = useMemo(() => {
    if (tab === "features") return "品牌入口、IP世界观与陪伴路线";
    if (tab === "wheel") return "抽取你的今日幸运色";
    if (tab === "oracle") return "今天的时色签和小提醒";
    return "小羊卷养成仓";
  }, [tab]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.brand}>ColorWalking</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.content}>
          {tab === "features" ? <FeaturesScreen onNavigate={setTab} /> : null}
          {tab === "wheel" ? <LuckyWheelScreen /> : null}
          {tab === "oracle" ? <OracleScreen /> : null}
          {tab === "pet" ? <PetScreen /> : null}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]}
              onPress={() => setTab(item.key)}
            >
              <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CHIBI_THEME.color.pageBg
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  brand: {
    fontSize: 38,
    fontWeight: "900",
    color: CHIBI_THEME.color.textStrong
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 15,
    color: CHIBI_THEME.color.textSoft
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10
  },
  tabBtn: {
    flex: 1,
    borderRadius: CHIBI_THEME.radius.pill,
    borderWidth: 1,
    borderColor: "#D6DEEE",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    alignItems: "center"
  },
  tabBtnActive: {
    backgroundColor: CHIBI_THEME.color.primary,
    borderColor: CHIBI_THEME.color.primary
  },
  tabText: {
    color: CHIBI_THEME.color.textNormal,
    fontWeight: "700",
    fontSize: 12
  },
  tabTextActive: {
    color: "#FFFFFF"
  }
});

