import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, CheckCircle, Share, ArrowDown, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import logo from "@/assets/logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  useSEO({
    title: "Install AI Coach Portal App – Learn AI On-the-Go",
    description: "Install the AI Coach Portal app on your phone or desktop. Access AI courses, webinars, and coaching anytime, anywhere — even offline.",
    canonical: "https://www.aicoachportal.com/install",
    ogTitle: "Install AI Coach Portal App – Learn AI On-the-Go",
    ogDescription: "Install the AI Coach Portal app on your phone or desktop for instant access to AI courses and coaching.",
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: "⚡", title: "Instant Access", desc: "Open the app directly from your home screen" },
    { icon: "📱", title: "Works Offline", desc: "Access cached content even without internet" },
    { icon: "🔔", title: "Fast Loading", desc: "Native app-like speed and smooth performance" },
    { icon: "🎓", title: "Full Experience", desc: "All courses, webinars, and features at your fingertips" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
            <img src={logo} alt="AI Coach Portal" className="h-16 w-16 rounded-xl" />
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Install AI Coach Portal
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Get the full app experience on your phone or desktop — no app store needed.
          </p>

          {isInstalled ? (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 text-primary">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">App is installed!</span>
            </div>
          ) : deferredPrompt ? (
            <Button size="lg" className="mt-8 gap-2 text-lg px-8" onClick={handleInstall}>
              <Download className="h-5 w-5" />
              Install Now
            </Button>
          ) : (
            <div className="mt-8 space-y-4">
              {isIOS && (
                <Card className="mx-auto max-w-md border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Install on iPhone / iPad
                    </h3>
                    <ol className="space-y-3 text-sm text-muted-foreground text-left">
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                        <span>Tap the <Share className="inline h-4 w-4 text-primary" /> <strong className="text-foreground">Share</strong> button in Safari</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                        <span>Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                        <span>Tap <strong className="text-foreground">"Add"</strong> to confirm</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}
              {isAndroid && (
                <Card className="mx-auto max-w-md border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Install on Android
                    </h3>
                    <ol className="space-y-3 text-sm text-muted-foreground text-left">
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                        <span>Tap the <MoreVertical className="inline h-4 w-4 text-primary" /> <strong className="text-foreground">menu</strong> button in Chrome</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                        <span>Tap <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home screen"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                        <span>Tap <strong className="text-foreground">"Install"</strong> to confirm</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}
              {!isIOS && !isAndroid && (
                <Card className="mx-auto max-w-md border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />
                      Install on Desktop
                    </h3>
                    <ol className="space-y-3 text-sm text-muted-foreground text-left">
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                        <span>Look for the <ArrowDown className="inline h-4 w-4 text-primary" /> <strong className="text-foreground">install icon</strong> in the address bar</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                        <span>Click <strong className="text-foreground">"Install"</strong> to add to your desktop</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground">Why Install the App?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="border-border">
                <CardContent className="flex items-start gap-4 pt-5">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Screenshots preview */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <h2 className="mb-4 text-xl font-bold text-foreground">Works on All Devices</h2>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-card border border-border">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">iPhone</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-card border border-border">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Android</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-card border border-border">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Desktop</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
