import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Upload, Search, Trash2 } from "lucide-react";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  tags: string[];
  is_opted_in: boolean;
  source: string;
  created_at: string;
}

const WhatsAppContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ phone: "", name: "", email: "", tags: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("whatsapp_contacts")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });
    setContacts((data as Contact[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const addContact = async () => {
    if (!user || !form.phone.trim()) return;
    const { error } = await supabase.from("whatsapp_contacts").insert({
      coach_id: user.id,
      phone: form.phone.trim(),
      name: form.name.trim() || null,
      email: form.email.trim() || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      source: "manual",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact Added" });
      setAddOpen(false);
      setForm({ phone: "", name: "", email: "", tags: "" });
      fetchContacts();
    }
  };

  const deleteContact = async (id: string) => {
    await supabase.from("whatsapp_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Contact Removed" });
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) {
      toast({ title: "Invalid CSV", description: "Need at least a header and one row.", variant: "destructive" });
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("whatsapp") || h.includes("mobile"));
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const tagIdx = headers.findIndex((h) => h.includes("tag"));

    if (phoneIdx === -1) {
      toast({ title: "Missing phone column", description: "CSV must have a phone/whatsapp/mobile column.", variant: "destructive" });
      return;
    }

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        coach_id: user.id,
        phone: cols[phoneIdx] || "",
        name: nameIdx >= 0 ? cols[nameIdx] || null : null,
        email: emailIdx >= 0 ? cols[emailIdx] || null : null,
        tags: tagIdx >= 0 && cols[tagIdx] ? cols[tagIdx].split(";").map((t) => t.trim()) : [],
        source: "csv",
      };
    }).filter((r) => r.phone);

    if (rows.length === 0) {
      toast({ title: "No valid rows found", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("whatsapp_contacts").insert(rows);
    if (error) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${rows.length} contacts imported` });
      fetchContacts();
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const filtered = contacts.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Contacts ({contacts.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Contact</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Phone Number *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." /></div>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact name" /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
                <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="lead, student" /></div>
                <Button className="w-full" onClick={addContact} disabled={!form.phone.trim()}>Add Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No contacts found. Add contacts or import via CSV.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(c.tags || []).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">{c.source}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_opted_in ? "default" : "secondary"}>
                          {c.is_opted_in ? "Opted In" : "Opted Out"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteContact(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppContacts;
