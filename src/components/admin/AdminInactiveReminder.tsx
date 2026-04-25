import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, Send, Play, Eye } from "lucide-react";

interface Config {
  id: string;
  is_enabled: boolean;
  user_type: "all" | "coach" | "learner";
  inactivity_days: number;
  frequency_type: "once" | "repeat";
  repeat_interval_days: number;
  email_subject: string;
  email_body: string;
  cta_text: string;
  cta_url: string;
  cta_new_tab: boolean;
}

interface LogRow {
  id: string;
  email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const SAMPLE = {
  UserName: "Alex",
  LastLoginDate: "2026-04-10",
  DaysInactive: "15",
  LoginLink: "https://www.aicoachportal.com/login",
};

function renderTpl(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

export default function AdminInactiveReminder() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState({ sent: 0, failed: 0, last24: 0 });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: c } = await supabase
      .from("inactive_reminder_config" as any)
      .select("*")
      .limit(1)
      .maybeSingle();
    if (c) setCfg(c as unknown as Config);

    const { data: l } = await supabase
      .from("inactive_reminder_logs" as any)
      .select("id,email,status,error_message,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((l as unknown as LogRow[]) || []);

    const since = new Date(Date.now() - 86400000).toISOString();
    const { data: s24 } = await supabase
      .from("inactive_reminder_logs" as any)
      .select("status", { count: "exact" })
      .gte("created_at", since);
    const all = (s24 as unknown as Array<{ status: string }>) || [];
    setStats({
      sent: all.filter((x) => x.status === "sent").length,
      failed: all.filter((x) => x.status === "failed").length,
      last24: all.length,
    });
    setLoading(false);
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    const { error } = await supabase
      .from("inactive_reminder_config" as any)
      .update({
        is_enabled: cfg.is_enabled,
        user_type: cfg.user_type,
        inactivity_days: cfg.inactivity_days,
        frequency_type: cfg.frequency_type,
        repeat_interval_days: cfg.repeat_interval_days,
        email_subject: cfg.email_subject,
        email_body: cfg.email_body,
        cta_text: cfg.cta_text,
        cta_url: cfg.cta_url,
        cta_new_tab: cfg.cta_new_tab,
      })
      .eq("id", cfg.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Configuration saved");
  }

  async function sendTest() {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("inactive-user-reminder", {
      body: { mode: "test", email: testEmail },
    });
    setTesting(false);
    if (error || !(data as any)?.ok) {
      toast.error((data as any)?.error || error?.message || "Test failed");
    } else {
      toast.success("Test email sent");
      void load();
    }
  }

  async function runNow() {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("inactive-user-reminder", {
      body: { mode: "run" },
    });
    setRunning(false);
    if (error || !(data as any)?.ok) {
      toast.error((data as any)?.error || error?.message || "Run failed");
    } else {
      const r = data as any;
      toast.success(`Processed ${r.processed ?? 0} • Sent ${r.sent ?? 0} • Failed ${r.failed ?? 0}`);
      void load();
    }
  }

  const previewSubject = useMemo(
    () => (cfg ? renderTpl(cfg.email_subject, SAMPLE) : ""),
    [cfg],
  );
  const previewBody = useMemo(
    () => (cfg ? renderTpl(cfg.email_body, SAMPLE) : ""),
    [cfg],
  );

  if (loading || !cfg) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Mail className="h-5 w-5" /> Inactive User Reminder
          </h2>
          <p className="text-sm text-muted-foreground">
            Automatically re-engage users who haven't logged in for a while.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Switch
              checked={cfg.is_enabled}
              onCheckedChange={(v) => setCfg({ ...cfg, is_enabled: v })}
            />
            <span className="text-sm font-medium">
              {cfg.is_enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <Button onClick={runNow} disabled={running} variant="secondary">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Sent (24h)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.sent}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Failed (24h)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.failed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Activity (24h)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.last24}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Targeting & Schedule</h3>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select
              value={cfg.user_type}
              onValueChange={(v) => setCfg({ ...cfg, user_type: v as Config["user_type"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="coach">Coaches Only</SelectItem>
                <SelectItem value="learner">Learners Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Trigger After (Days)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={cfg.inactivity_days}
                onChange={(e) =>
                  setCfg({ ...cfg, inactivity_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={cfg.frequency_type}
                onValueChange={(v) => setCfg({ ...cfg, frequency_type: v as Config["frequency_type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Send Once</SelectItem>
                  <SelectItem value="repeat">Repeat Every X Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {cfg.frequency_type === "repeat" && (
            <div className="space-y-2">
              <Label>Repeat Every (Days)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={cfg.repeat_interval_days}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    repeat_interval_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)),
                  })
                }
              />
            </div>
          )}

          <hr className="border-border" />
          <h3 className="text-sm font-semibold text-foreground">Email Content</h3>
          <p className="text-xs text-muted-foreground">
            Variables: <code>{"{{UserName}}"}</code>, <code>{"{{LastLoginDate}}"}</code>,{" "}
            <code>{"{{DaysInactive}}"}</code>, <code>{"{{LoginLink}}"}</code>
          </p>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={cfg.email_subject}
              onChange={(e) => setCfg({ ...cfg, email_subject: e.target.value })}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              rows={8}
              value={cfg.email_body}
              onChange={(e) => setCfg({ ...cfg, email_body: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CTA Button Text</Label>
              <Input
                value={cfg.cta_text}
                onChange={(e) => setCfg({ ...cfg, cta_text: e.target.value })}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input
                value={cfg.cta_url}
                onChange={(e) => setCfg({ ...cfg, cta_url: e.target.value })}
                placeholder="/login or https://..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={cfg.cta_new_tab}
              onCheckedChange={(v) => setCfg({ ...cfg, cta_new_tab: v })}
            />
            <span className="text-sm">Open CTA in new tab</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button variant="outline" onClick={sendTest} disabled={testing}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Test
              </Button>
            </div>
          </div>
        </div>

        {/* Preview + Logs */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="h-4 w-4" /> Live Preview
            </h3>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Subject
              </p>
              <p className="mb-4 text-base font-semibold text-foreground">{previewSubject}</p>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Body</p>
              <div className="whitespace-pre-wrap text-sm text-foreground">{previewBody}</div>
              <div className="mt-4 text-center">
                <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  {cfg.cta_text}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h3>
            <div className="max-h-72 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {logs.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{l.email}</p>
                        {l.error_message && (
                          <p className="truncate text-xs text-destructive">{l.error_message}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.status === "sent"
                            ? "bg-primary/10 text-primary"
                            : l.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {l.status}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
