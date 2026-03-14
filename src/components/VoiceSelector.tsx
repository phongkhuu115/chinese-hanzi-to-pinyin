import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  loadVoices,
  getChineseVoices,
  getSelectedVoiceName,
  setSelectedVoiceName,
} from "@/lib/tts";

export function VoiceSelector() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string>(
    getSelectedVoiceName() ?? "__auto__"
  );

  useEffect(() => {
    loadVoices().then(() => {
      const chinese = getChineseVoices();
      setVoices(chinese);
      // If saved voice is no longer available, reset to auto
      if (
        selected !== "__auto__" &&
        !chinese.find((v) => v.name === selected)
      ) {
        setSelected("__auto__");
        setSelectedVoiceName(null);
      }
    });
  }, [selected]);

  if (voices.length === 0) return null;

  function handleChange(value: string) {
    setSelected(value);
    setSelectedVoiceName(value === "__auto__" ? null : value);
  }

  return (
    <div className="flex items-center gap-1.5">
      <Mic className="size-3.5 text-muted-foreground shrink-0" />
      <Select value={selected} onValueChange={handleChange}>
        <SelectTrigger className="h-7 text-xs w-40 border-border">
          <SelectValue placeholder="Auto voice" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__auto__">
            <span className="text-muted-foreground">Auto (default)</span>
          </SelectItem>
          {voices.map((v) => (
            <SelectItem key={v.name} value={v.name}>
              <div className="flex flex-col">
                <span className="text-xs font-medium leading-tight">{v.name}</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {v.lang}
                  {v.localService ? " · local" : " · network"}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
