import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const APK_URL = "https://www.colorful-lamb-rolls.cloud/download/app.apk";

export function DownloadScreen() {
  const onOpen = async () => {
    try {
      await Linking.openURL(APK_URL);
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>下载 App</Text>
        <Text style={styles.desc}>点击按钮可在浏览器中打开最新安装包下载链接。</Text>
        <Pressable style={styles.btn} onPress={() => void onOpen()}>
          <Text style={styles.btnText}>打开下载链接</Text>
        </Pressable>
        <Text style={styles.url}>{APK_URL}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  title: { fontSize: 19, fontWeight: "800", color: "#24365C", marginBottom: 8 },
  desc: { color: "#63759B", lineHeight: 20, marginBottom: 10 },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#4B7FE8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  btnText: { color: "#FFFFFF", fontWeight: "700" },
  url: { marginTop: 10, color: "#6E7FA1", fontSize: 12 }
});
