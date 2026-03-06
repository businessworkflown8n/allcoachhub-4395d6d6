import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CommSettings {
  chatbot_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_message: string;
  call_enabled: boolean;
  call_number: string;
}

const defaults: CommSettings = {
  chatbot_enabled: true,
  whatsapp_enabled: true,
  whatsapp_number: "919852411280",
  whatsapp_message: "Hi, I would like to know more about AI Coach Portal",
  call_enabled: true,
  call_number: "+919852411280",
};

export const useCommunicationSettings = () => {
  const [settings, setSettings] = useState<CommSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("communication_settings" as any).select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        (data as any[]).forEach(d => { map[d.key] = d.value; });
        setSettings({
          chatbot_enabled: map.chatbot_enabled !== "false",
          whatsapp_enabled: map.whatsapp_enabled !== "false",
          whatsapp_number: map.whatsapp_number || defaults.whatsapp_number,
          whatsapp_message: map.whatsapp_message || defaults.whatsapp_message,
          call_enabled: map.call_enabled !== "false",
          call_number: map.call_number || defaults.call_number,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { settings, loading };
};
