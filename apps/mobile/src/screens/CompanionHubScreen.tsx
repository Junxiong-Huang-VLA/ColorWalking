import {
  getBrandWorldProfile,
  getCompanionModules,
  getProductShowcase,
  type CompanionModule
} from "@colorwalking/shared";
import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

function moduleSummary(module: CompanionModule, connected: boolean): string {
  if (module.id === "device") {
    return connected ? "设备链路正常，正在等待下一次同步。" : "设备未连接，当前保持纯软件陪伴模式。";
  }
  return module.summary;
}

export function CompanionHubScreen() {
  const world = getBrandWorldProfile();
  const modules = getCompanionModules();
  const featuredImage = getProductShowcase()[0];
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [emotionLevel, setEmotionLevel] = useState(72);
  const [activeModuleId, setActiveModuleId] = useState<CompanionModule["id"]>("emotion");
  const activeModule = useMemo(
    () => modules.find((item) => item.id === activeModuleId) ?? modules[0],
    [activeModuleId, modules]
  );

  return (
    <View style={styles.root}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{world.heroName}</Text>
        <Text style={styles.heroSubtitle}>{world.heroTitle}</Text>
        <Text style={styles.heroStory}>{world.originStory}</Text>
      </View>

      <View style={styles.moduleRow}>
        {modules.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.moduleChip, activeModuleId === item.id && styles.moduleChipActive]}
            onPress={() => setActiveModuleId(item.id)}
          >
            <Text style={[styles.moduleChipText, activeModuleId === item.id && styles.moduleChipTextActive]}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{activeModule.name}</Text>
        <Text style={styles.statusSummary}>{moduleSummary(activeModule, deviceConnected)}</Text>
        <Text style={styles.statusHint}>{activeModule.upgradePath}</Text>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>情绪值</Text>
          <Text style={styles.metricValue}>{emotionLevel}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={() => setEmotionLevel((v) => Math.min(100, v + 6))}>
              <Text style={styles.actionBtnText}>+ 安抚</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => setEmotionLevel((v) => Math.max(0, v - 6))}>
              <Text style={styles.actionBtnText}>- 疲惫</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>记忆回路</Text>
          <Text style={styles.metricBody}>今天记录了 3 条温柔片段，幸运色为「云蓝」。</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>互动中枢</Text>
          <Text style={styles.metricBody}>已完成 4 次低打扰互动，可继续文字或语音陪伴。</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>设备联动</Text>
          <Text style={styles.metricBody}>{deviceConnected ? "已连接硬件占位链路。" : "未连接硬件，保持 Web/App Demo 模式。"}</Text>
          <Pressable style={styles.toggleBtn} onPress={() => setDeviceConnected((v) => !v)}>
            <Text style={styles.toggleBtnText}>{deviceConnected ? "断开设备" : "连接设备占位"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.imageCard}>
        <Image source={{ uri: featuredImage.mobileImageUrl }} style={styles.productImage} />
        <Text style={styles.imageCaption}>主素材：{featuredImage.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2A44"
  },
  heroSubtitle: {
    marginTop: 2,
    color: "#5E6F8D",
    fontWeight: "600"
  },
  heroStory: {
    marginTop: 8,
    color: "#42516C",
    lineHeight: 20
  },
  moduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  moduleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C8D5EC",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  moduleChipActive: {
    backgroundColor: "#1F2A44",
    borderColor: "#1F2A44"
  },
  moduleChipText: {
    color: "#3A4A68"
  },
  moduleChipTextActive: {
    color: "#FFFFFF"
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2A44"
  },
  statusSummary: {
    marginTop: 6,
    color: "#40506D",
    lineHeight: 20
  },
  statusHint: {
    marginTop: 5,
    color: "#677892"
  },
  metricGrid: {
    gap: 8
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12
  },
  metricLabel: {
    color: "#5D6F8F",
    fontSize: 13
  },
  metricValue: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2A44"
  },
  metricBody: {
    marginTop: 6,
    color: "#3E4E6B",
    lineHeight: 19
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  actionBtn: {
    borderRadius: 8,
    backgroundColor: "#1F2A44",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  toggleBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#25365A",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  toggleBtnText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  imageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10
  },
  imageCaption: {
    marginTop: 6,
    color: "#5C6D8A"
  }
});
