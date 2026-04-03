export type ColorItem = {
  id: string;
  name: string;
  hex: string;
  message: string;
};

export const COLOR_PALETTE: ColorItem[] = [
  { id: "sunrise-coral", name: "晨曦珊瑚", hex: "#FF6B6B", message: "今天你会被温柔看见。" },
  { id: "golden-spark", name: "金色闪光", hex: "#FFD93D", message: "你的努力会有回应。" },
  { id: "mint-breath", name: "薄荷呼吸", hex: "#6BCB77", message: "慢一点，也是在前进。" },
  { id: "river-blue", name: "河流蓝", hex: "#4D96FF", message: "清醒和坚定正在靠近你。" },
  { id: "grape-night", name: "葡萄夜", hex: "#845EC2", message: "你有独特的节奏与光芒。" },
  { id: "peach-mist", name: "蜜桃雾", hex: "#FF9671", message: "把今天过成你喜欢的样子。" },
  { id: "sky-foam", name: "天空泡沫", hex: "#00C9A7", message: "你会在轻盈中找到答案。" },
  { id: "rose-dawn", name: "玫瑰黎明", hex: "#F9A8D4", message: "浪漫和好运会一起出现。" }
];
