import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MailX } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnsubscribe = async () => {
    if (!email) return;
    setLoading(true);
    await supabase
      .from("email_contacts" as any)
      .update({ is_unsubscribed: true } as any)
      .eq("email", email);
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex items-center justify-center pt-32 pb-20 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            {done ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
                <p className="text-muted-foreground">You have been successfully unsubscribed from our emails.</p>
              </>
            ) : (
              <>
                <MailX className="h-12 w-12 text-primary mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
                <p className="text-muted-foreground">
                  {email ? `Unsubscribe ${email} from AI Coach Portal emails?` : "Invalid unsubscribe link."}
                </p>
                {email && (
                  <Button onClick={handleUnsubscribe} disabled={loading} className="w-full">
                    {loading ? "Processing..." : "Confirm Unsubscribe"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
