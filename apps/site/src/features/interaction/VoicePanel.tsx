type VoicePanelProps = {
  isRecording: boolean;
  onMockVoice: () => void;
  onStartBedtime: () => void;
};

export function VoicePanel({ isRecording, onMockVoice, onStartBedtime }: VoicePanelProps) {
  return (
    <article className="card voice-panel">
      <h3>语音陪伴</h3>
      <p className="muted">一句语音就可以让小羊卷接住你当下的情绪。</p>
      <div className="state-chip-row" style={{ marginBottom: 8 }}>
        <span>{isRecording ? "录音中…" : "待机中"}</span>
      </div>
      <button type="button" className="ghost-btn" onClick={onMockVoice}>
        发送一段语音
      </button>
      <button type="button" className="ghost-btn" onClick={onStartBedtime}>
        开启睡前模式
      </button>
    </article>
  );
}
