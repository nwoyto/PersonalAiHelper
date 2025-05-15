interface SoundWaveProps {
  className?: string;
}

export default function SoundWave({ className = "" }: SoundWaveProps) {
  return (
    <div className={`sound-wave ${className}`}>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}
