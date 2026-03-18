import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, Shield, Database, RefreshCw, Clock
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformId: string;
  platformName: string;
  onConnected: () => void;
};

const STEPS = [
  { title: "Select Account", desc: "Choose which ad account to connect" },
  { title: "Grant Permissions", desc: "Authorize data access" },
  { title: "Data Selection", desc: "Choose what data to sync" },
  { title: "Mapping", desc: "Map account to coach and settings" },
  { title: "Confirmation", desc: "Review and confirm" },
];

const DATA_OPTIONS = [
  { key: "campaigns", label: "Campaigns", desc: "Campaign-level performance data" },
  { key: "adsets", label: "Ad Sets / Ad Groups", desc: "Ad set level breakdowns" },
  { key: "ads", label: "Ads / Creatives", desc: "Individual ad performance" },
  { key: "conversions", label: "Conversion Data", desc: "Conversion events and tracking" },
];

const AdminIntegrationWizard = ({ open, onOpenChange, platformId, platformName, onConnected }: Props) => {
  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);

  // Step 1: Account
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");

  // Step 3: Data selection
  const [selectedData, setSelectedData] = useState<string[]>(["campaigns", "conversions"]);

  // Step 4: Mapping
  const [coachMapping, setCoachMapping] = useState("self");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [syncFrequency, setSyncFrequency] = useState("daily");
  const [historicalDays, setHistoricalDays] = useState("30");

  const toggleData = (key: string) => {
    setSelectedData(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  const handleFinish = async () => {
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ad_platform_connections").insert({
        platform: platformId,
        coach_id: user.id,
        status: "connected",
        credentials_encrypted: {
          account_id: accountId,
          account_name: accountName,
          data_scope: selectedData,
          currency,
          timezone,
          sync_frequency: syncFrequency,
          historical_days: Number(historicalDays),
        },
      });

      if (error) throw error;
      toast.success(`${platformName} connected successfully!`);
      onConnected();
      onOpenChange(false);
      resetWizard();
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setAccountId("");
    setAccountName("");
    setSelectedData(["campaigns", "conversions"]);
    setCoachMapping("self");
    setCurrency("INR");
    setTimezone("Asia/Kolkata");
    setSyncFrequency("daily");
    setHistoricalDays("30");
  };

  const canProceed = () => {
    if (step === 0) return accountId.trim() !== "" && accountName.trim() !== "";
    if (step === 2) return selectedData.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetWizard(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Connect {platformName}
            <Badge variant="outline" className="text-xs">Step {step + 1} of {STEPS.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="mb-1">
          <p className="font-medium text-foreground">{STEPS[step].title}</p>
          <p className="text-xs text-muted-foreground">{STEPS[step].desc}</p>
        </div>

        <Separator />

        {/* Step 0: Account Selection */}
        {step === 0 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Enter your {platformName} account details. You can find the Account ID in your {platformName} dashboard settings.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Account ID</label>
              <Input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder={`e.g., ${platformId === "google_ads" ? "123-456-7890" : "act_123456789"}`} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Account Name</label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="My Business Account" className="mt-1" />
            </div>
          </div>
        )}

        {/* Step 1: Permissions */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">Required Permissions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The following permissions will be requested from {platformName}:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {["Read campaign data", "Read ad performance metrics", "Read conversion data", "Read audience insights"].map(p => (
                      <li key={p} className="text-xs text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-400" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your credentials are encrypted and stored securely. We only request read-only access.
            </p>
          </div>
        )}

        {/* Step 2: Data Selection */}
        {step === 2 && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Choose what data to sync from {platformName}:</p>
            {DATA_OPTIONS.map(opt => (
              <label key={opt.key} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <Checkbox checked={selectedData.includes(opt.key)} onCheckedChange={() => toggleData(opt.key)} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Step 3: Mapping */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Timezone</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2"><RefreshCw className="h-3 w-3" /> Sync Frequency</label>
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Historical Data Import</label>
              <Select value={historicalDays} onValueChange={setHistoricalDays}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium text-foreground">{platformName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="font-medium text-foreground">{accountName} ({accountId})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data Scope</span>
                <span className="font-medium text-foreground">{selectedData.length} types</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium text-foreground">{currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sync Frequency</span>
                <span className="font-medium text-foreground capitalize">{syncFrequency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Historical Import</span>
                <span className="font-medium text-foreground">{historicalDays} days</span>
              </div>
            </div>
            <div className="rounded-lg border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                Data will begin syncing after connection is confirmed. First sync may take a few minutes.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinish} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Confirm & Connect
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminIntegrationWizard;
