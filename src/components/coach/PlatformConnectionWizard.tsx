import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, Shield, ExternalLink,
  AlertCircle, BookOpen, Info
} from "lucide-react";

type SetupGuide = {
  steps: Array<{ title: string; description: string }>;
  prerequisites: string[];
  common_errors: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformId: string;
  platformName: string;
  onConnected: () => void;
  coachId?: string;
};

const PlatformConnectionWizard = ({ open, onOpenChange, platformId, platformName, onConnected, coachId }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=guide, 1=connecting, 2=account-select, 3=success
  const [loading, setLoading] = useState(false);
  const [setupGuide, setSetupGuide] = useState<SetupGuide | null>(null);
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open && platformId) {
      setStep(0);
      setErrorMessage("");
      fetchSetupGuide();
      checkCredentials();
    }
  }, [open, platformId]);

  const fetchSetupGuide = async () => {
    const { data } = await supabase
      .from("platform_integrations_config")
      .select("setup_guide")
      .eq("platform_id", platformId)
      .single();
    if (data?.setup_guide) {
      setSetupGuide(data.setup_guide as unknown as SetupGuide);
    }
  };

  const checkCredentials = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("platform-oauth", {
        body: { action: "check_credentials", platform: platformId },
      });
      setCredentialsConfigured(data?.configured ?? false);
    } catch {
      setCredentialsConfigured(false);
    }
  };

  const handleProceedToConnect = async () => {
    setStep(1);
    setLoading(true);
    setErrorMessage("");

    try {
      const redirectUri = `${window.location.origin}/oauth-callback`;
      const targetCoachId = coachId || user?.id;

      const { data, error } = await supabase.functions.invoke("platform-oauth", {
        body: {
          action: "get_auth_url",
          platform: platformId,
          redirectUri,
          coachId: targetCoachId,
        },
      });

      if (error || data?.error) {
        if (data?.credentials_missing) {
          setErrorMessage(`OAuth credentials not configured for ${platformName}. Admin needs to add API keys.`);
          setLoading(false);
          return;
        }
        throw new Error(data?.error || error?.message || "Failed to generate auth URL");
      }

      if (data?.authUrl) {
        // Open OAuth in popup window
        const popup = window.open(data.authUrl, `${platformId}_oauth`, "width=600,height=700,scrollbars=yes");

        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === "oauth_callback" && event.data?.code) {
            window.removeEventListener("message", handleMessage);
            popup?.close();

            // Exchange code for tokens
            const { data: tokenData, error: tokenError } = await supabase.functions.invoke("platform-oauth", {
              body: {
                action: "exchange_code",
                platform: platformId,
                code: event.data.code,
                redirectUri,
                coachId: targetCoachId,
              },
            });

            if (tokenError || tokenData?.error) {
              setErrorMessage(tokenData?.error || "Failed to exchange authorization code");
              setLoading(false);
              return;
            }

            if (tokenData?.has_accounts && tokenData.accounts?.length > 0) {
              setAccounts(tokenData.accounts);
              setStep(2);
            } else {
              setStep(3);
              onConnected();
            }
            setLoading(false);
          }

          if (event.data?.type === "oauth_error") {
            window.removeEventListener("message", handleMessage);
            popup?.close();
            setErrorMessage(event.data.error || "Authorization was denied");
            setLoading(false);
          }
        };

        window.addEventListener("message", handleMessage);

        // Fallback: check if popup was closed without completing
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            window.removeEventListener("message", handleMessage);
            if (step === 1) {
              setErrorMessage("Authorization window was closed. Please try again.");
              setLoading(false);
            }
          }
        }, 1000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setErrorMessage(message);
      setLoading(false);
    }
  };

  const handleSelectAccount = async () => {
    if (!selectedAccount) return;
    setLoading(true);

    const selectedAccObj = accounts.find(a => a.id === selectedAccount);
    const targetCoachId = coachId || user?.id;

    const { error } = await supabase.from("ad_platform_connections")
      .update({
        status: "connected",
        account_id: selectedAccount,
        account_name: selectedAccObj?.name || selectedAccount,
      })
      .eq("coach_id", targetCoachId)
      .eq("platform", platformId);

    if (error) {
      toast.error("Failed to save account selection");
      setLoading(false);
      return;
    }

    setStep(3);
    setLoading(false);
    onConnected();
  };

  const resetWizard = () => {
    setStep(0);
    setAccounts([]);
    setSelectedAccount("");
    setErrorMessage("");
    setLoading(false);
    setShowGuide(false);
  };

  const STEP_LABELS = ["Setup Guide", "Connecting", "Select Account", "Connected"];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetWizard(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Connect {platformName}
            <Badge variant="outline" className="text-xs">{STEP_LABELS[step]}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <Separator />

        {/* Step 0: Guided Instructions */}
        {step === 0 && (
          <div className="space-y-4 py-2">
            {credentialsConfigured === false && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">API Credentials Not Configured</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Admin needs to add OAuth credentials for {platformName} before connections can be made.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Before you connect
              </p>

              {setupGuide?.prerequisites && setupGuide.prerequisites.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Prerequisites:</p>
                  <ul className="space-y-1">
                    {setupGuide.prerequisites.map((p, i) => (
                      <li key={i} className="text-xs text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {setupGuide?.steps && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Connection Steps:</p>
                  {setupGuide.steps.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Setup Guide toggle */}
            {setupGuide?.common_errors && setupGuide.common_errors.length > 0 && (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setShowGuide(!showGuide)} className="gap-1 text-xs">
                  <BookOpen className="h-3 w-3" /> {showGuide ? "Hide" : "View"} Troubleshooting Guide
                </Button>
                {showGuide && (
                  <div className="mt-2 rounded-lg border p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Common Issues:</p>
                    {setupGuide.common_errors.map((e, i) => (
                      <p key={i} className="text-xs text-foreground flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0" /> {e}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleProceedToConnect}
                disabled={credentialsConfigured === false}
                className="gap-1"
              >
                Proceed to Connect <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Connecting / Loading */}
        {step === 1 && (
          <div className="py-8 text-center space-y-4">
            {loading && !errorMessage ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-foreground font-medium">Connecting to {platformName}...</p>
                <p className="text-xs text-muted-foreground">
                  Please complete the authorization in the popup window.
                </p>
              </>
            ) : errorMessage ? (
              <>
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-foreground font-medium">Connection Failed</p>
                <p className="text-xs text-destructive">{errorMessage}</p>
                <Button variant="outline" size="sm" onClick={() => { setStep(0); setErrorMessage(""); }}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Try Again
                </Button>
              </>
            ) : null}
          </div>
        )}

        {/* Step 2: Account Selection */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Multiple accounts found. Select the account you want to connect:
            </p>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button size="sm" onClick={handleSelectAccount} disabled={!selectedAccount || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Confirm Selection
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-bold text-foreground">{platformName} Connected!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your account is now linked. Data will begin syncing shortly.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-left space-y-1 max-w-xs mx-auto">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium text-foreground">{platformName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Connected</Badge>
              </div>
            </div>
            <Button size="sm" onClick={() => { onOpenChange(false); resetWizard(); }}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlatformConnectionWizard;
