import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";

interface Props {
  coachId: string;
  instituteName: string;
  themeColor: string;
}

const CoachWebsiteDemoForm = ({ coachId, instituteName, themeColor }: Props) => {
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("chatbot_leads").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      user_type: "learner",
      user_id: coachId,
      company: instituteName,
    });
    setLoading(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
      toast.success("Demo request submitted successfully!");
    }
  };

  if (submitted) {
    return (
      <section id="cw-demo" className="border-b border-border py-14">
        <div className="container mx-auto max-w-md px-4 text-center">
          <CalendarCheck className="mx-auto mb-4 h-12 w-12" style={{ color: themeColor }} />
          <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
          <p className="mt-2 text-muted-foreground">Your demo request has been submitted. We'll reach out soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="cw-demo" className="border-b border-border py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-1 text-center text-2xl font-bold text-foreground">Book a Free Demo</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">Experience our teaching style firsthand</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="demo-name">Full Name</Label>
              <Input id="demo-name" placeholder="Your name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} maxLength={255} />
            </div>
            <div>
              <Label htmlFor="demo-whatsapp">WhatsApp Number</Label>
              <Input id="demo-whatsapp" placeholder="+91 98765 43210" value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} maxLength={20} />
            </div>
            <Button type="submit" className="w-full text-base font-semibold" style={{ backgroundColor: themeColor }} disabled={loading}>
              {loading ? "Submitting…" : "Book Free Demo"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteDemoForm;
