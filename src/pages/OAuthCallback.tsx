import { useEffect } from "react";

const OAuthCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const state = params.get("state");

    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: "oauth_callback", code, state }, window.location.origin);
      } else {
        window.opener.postMessage({
          type: "oauth_error",
          error: error || "Authorization failed",
        }, window.location.origin);
      }
    }

    // Auto-close after a short delay
    setTimeout(() => window.close(), 1500);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Completing authorization...</p>
        <p className="text-xs text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
