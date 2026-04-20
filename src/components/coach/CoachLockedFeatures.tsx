import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, BookOpen, Video, Share2, Megaphone, MessageCircle, FileText, KeyRound, ImageIcon, Sparkles } from "lucide-react";
import { useCoachFeatures } from "@/hooks/useCoachFeatures";
import RequestFeatureAccessModal from "./RequestFeatureAccessModal";

const CATALOG = [
  { key: "courses_access", label: "Courses", desc: "Create & sell courses to learners", icon: BookOpen },
  { key: "workshops_access", label: "Workshops & Webinars", desc: "Run live sessions and webinars", icon: Video },
  { key: "feed_access", label: "Social Media Hub", desc: "Schedule and publish to social media", icon: Share2 },
  { key: "messaging_access", label: "Email & WhatsApp Campaigns", desc: "Run marketing campaigns", icon: Megaphone },
  { key: "paid_content_access", label: "Paid Content", desc: "Sell premium gated content", icon: Sparkles },
  { key: "contact_access", label: "Learner Contacts", desc: "View learner email & phone numbers", icon: KeyRound },
  { key: "materials_access", label: "Materials Library", desc: "Share resources with your learners", icon: FileText },
  { key: "blueprint_access", label: "Coaching Blueprint", desc: "AI-guided business builder", icon: Sparkles },
  { key: "profile_picture_access", label: "Profile Picture", desc: "Upload custom profile photo", icon: ImageIcon },
] as const;

const CoachLockedFeatures = () => {
  const features = useCoachFeatures();
  const [modal, setModal] = useState<{ key: string; label: string; desc: string } | null>(null);

  if (features.loading) return null;

  const locked = CATALOG.filter((f) => !features[f.key as keyof typeof features]);
  if (locked.length === 0) return null;

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Lock className="h-4 w-4" />Unlock more features</h3>
              <p className="text-sm text-muted-foreground">Request access from admin to grow your coaching business</p>
            </div>
            <Badge variant="secondary">{locked.length} locked</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="rounded-lg bg-muted p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{f.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setModal({ key: f.key, label: f.label, desc: f.desc })}>
                    Request Access
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {modal && (
        <RequestFeatureAccessModal
          open={!!modal}
          onOpenChange={(v) => !v && setModal(null)}
          featureKey={modal.key}
          featureLabel={modal.label}
          description={modal.desc}
        />
      )}
    </>
  );
};

export default CoachLockedFeatures;
