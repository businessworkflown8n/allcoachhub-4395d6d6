import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { key: "linkedin", label: "Follow on LinkedIn", settingKey: "social_linkedin_enabled", urlKey: "linkedin_url", clickKey: "linkedin_clicks", color: "bg-[#0A66C2]" },
  { key: "facebook", label: "Follow on Facebook", settingKey: "social_facebook_enabled", urlKey: "facebook_url", clickKey: "facebook_clicks", color: "bg-[#1877F2]" },
  { key: "instagram", label: "Visit Instagram", settingKey: "social_instagram_enabled", urlKey: "instagram_url", clickKey: "instagram_clicks", color: "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
  { key: "twitter", label: "Visit X", settingKey: "social_twitter_enabled", urlKey: "twitter_url", clickKey: "twitter_clicks", color: "bg-[#000000] border border-border" },
  { key: "youtube", label: "Watch on YouTube", settingKey: "social_youtube_enabled", urlKey: "youtube_url", clickKey: "youtube_clicks", color: "bg-[#FF0000]" },
  { key: "tiktok", label: "Follow on TikTok", settingKey: "social_tiktok_enabled", urlKey: "tiktok_url", clickKey: "tiktok_clicks", color: "bg-[#000000] border border-border" },
] as const;

interface MaterialSocialButtonsProps {
  material: any;
  settings: Record<string, boolean>;
}

const MaterialSocialButtons = ({ material, settings }: MaterialSocialButtonsProps) => {
  if (!settings.social_media_enabled) return null;

  const visiblePlatforms = PLATFORMS.filter(
    (p) => settings[p.settingKey] !== false && material[p.urlKey]
  );

  if (visiblePlatforms.length === 0) return null;

  const handleClick = async (platform: typeof PLATFORMS[number]) => {
    // Track click
    const currentClicks = material[platform.clickKey] || 0;
    await supabase
      .from("materials")
      .update({ [platform.clickKey]: currentClicks + 1 } as any)
      .eq("id", material.id);

    window.open(material[platform.urlKey], "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {visiblePlatforms.map((p) => (
        <Button
          key={p.key}
          variant="ghost"
          className={`${p.color} text-white hover:opacity-90 hover:text-white text-xs px-3 py-1.5 h-auto rounded-full`}
          onClick={() => handleClick(p)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
};

export default MaterialSocialButtons;
