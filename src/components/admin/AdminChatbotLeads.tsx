import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Users } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  user_type: string;
  name: string;
  whatsapp: string;
  email: string;
  experience: string | null;
  industry: string | null;
  company: string | null;
  country: string | null;
  created_at: string;
}

const AdminChatbotLeads = () => {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && user) fetchLeads();
  }, [authLoading, user]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chatbot_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  const filtered = leads.filter(l => {
    const matchesSearch = !search || 
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.whatsapp.includes(search);
    const matchesType = typeFilter === "all" || l.user_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    const headers = ["User Type", "Name", "WhatsApp", "Email", "Experience", "Industry", "Company", "Country", "Timestamp"];
    const rows = filtered.map(l => [
      l.user_type, l.name, l.whatsapp, l.email,
      l.experience || "", l.industry || "", l.company || "", l.country || "",
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatbot-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Chatbot Leads</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{filtered.length}</span>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, WhatsApp..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="AI Learner">AI Learner</SelectItem>
            <SelectItem value="AI Coach">AI Coach</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No leads found</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.user_type === "AI Learner" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"}`}>
                      {l.user_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.whatsapp}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.experience || "—"}</TableCell>
                  <TableCell>{l.industry || "—"}</TableCell>
                  <TableCell>{l.company || "—"}</TableCell>
                  <TableCell>{l.country || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{format(new Date(l.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminChatbotLeads;
