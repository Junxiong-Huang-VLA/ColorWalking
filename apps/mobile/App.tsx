import React, { useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View, Pressable } from "react-native";
import { LuckyWheelScreen } from "./src/screens/LuckyWheelScreen";
import { OracleScreen } from "./src/screens/OracleScreen";
import { PetScreen } from "./src/screens/PetScreen";
import { DownloadScreen } from "./src/screens/DownloadScreen";

type TabKey = "wheel" | "oracle" | "pet" | "download";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "wheel", label: "转盘" },
  { key: "oracle", label: "时色签" },
  { key: "pet", label: "小羊卷" },
  { key: "download", label: "下载" }
];

export default function App() {
  const [tab, setTab] = useState<TabKey>("wheel");

  const subtitle = useMemo(() => {
    if (tab === "wheel") return "抽取你的今日幸运色";
    if (tab === "oracle") return "今天的时色签和小提醒";
    if (tab === "pet") return "和小羊卷互动一下";
    return "下载与版本入口";
  }, [tab]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.brand}>ColorWalking</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.content}>
          {tab === "wheel" ? <LuckyWheelScreen /> : null}
          {tab === "oracle" ? <OracleScreen /> : null}
          {tab === "pet" ? <PetScreen /> : null}
          {tab === "download" ? <DownloadScreen /> : null}
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
    backgroundColor: "#F4F6FB"
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  brand: {
    fontSize: 38,
    fontWeight: "900",
    color: "#1F2A44"
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 15,
    color: "#62708A"
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6DEEE",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    alignItems: "center"
  },
  tabBtnActive: {
    backgroundColor: "#2F4B8A",
    borderColor: "#2F4B8A"
  },
  tabText: {
    color: "#425472",
    fontWeight: "700"
  },
  tabTextActive: {
    color: "#FFFFFF"
  }
});
