import { useState, useRef, useMemo } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

const VALID_STAGES = ["new", "contacted", "call_booked", "proposal_sent", "converted", "lost"];
const STAGE_ALIASES: Record<string, string> = {
  new: "new", contacted: "contacted", "call booked": "call_booked", call_booked: "call_booked",
  "proposal sent": "proposal_sent", proposal_sent: "proposal_sent", converted: "converted", lost: "lost",
};

const HEADERS = ["Full Name", "Email", "Phone", "Stage", "Source", "Estimated Value", "Next Action", "Notes"];

interface ParsedRow {
  rowIndex: number;
  full_name: string;
  email: string;
  phone: string;
  stage: string;
  source: string;
  estimated_value: number;
  next_action: string;
  notes: string;
  errors: string[];
  duplicate?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  coachId: string;
  leads: any[];
  onImported: () => void;
}

export default function LeadsCSVDialog({ open, onOpenChange, coachId, leads, onImported }: Props) {
  const [mode, setMode] = useState<"menu" | "upload" | "export">("menu");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "update" | "create">("skip");
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; updated: number; errors: number } | null>(null);
  const [exportStage, setExportStage] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode("menu"); setRows([]); setProgress(0); setImporting(false); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const close = () => { reset(); onOpenChange(false); };

  const existingEmails = useMemo(() => new Set(leads.filter(l => l.email).map(l => l.email.toLowerCase())), [leads]);
  const existingPhones = useMemo(() => new Set(leads.filter(l => l.phone).map(l => l.phone.replace(/\D/g, ""))), [leads]);

  const validateRow = (raw: any, idx: number): ParsedRow => {
    const errors: string[] = [];
    const get = (k: string) => String(raw[k] ?? raw[k.toLowerCase()] ?? raw[k.replace(/ /g, "_").toLowerCase()] ?? "").trim();

    const full_name = get("Full Name");
    const email = get("Email");
    const phoneRaw = get("Phone");
    const stageRaw = get("Stage").toLowerCase();
    const source = get("Source") || "manual";
    const valRaw = get("Estimated Value");
    const next_action = get("Next Action");
    const notes = get("Notes");

    if (!full_name) errors.push("Full Name required");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email");
    const phone = phoneRaw.replace(/\D/g, "");
    if (phoneRaw && !phone) errors.push("Phone must be numeric");
    const stage = STAGE_ALIASES[stageRaw] || (stageRaw === "" ? "new" : "");
    if (!stage || !VALID_STAGES.includes(stage)) errors.push(`Invalid stage "${stageRaw}"`);
    const estimated_value = valRaw ? Number(valRaw) : 0;
    if (valRaw && isNaN(estimated_value)) errors.push("Estimated Value must be numeric");

    const duplicate = (email && existingEmails.has(email.toLowerCase())) || (phone && existingPhones.has(phone));

    return { rowIndex: idx + 2, full_name, email, phone, stage: stage || "new", source, estimated_value, next_action, notes, errors, duplicate };
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) { toast.error("Only .csv files allowed"); return; }
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        if (res.data.length > 10000) { toast.error("Max 10,000 rows per upload"); return; }
        const parsed = (res.data as any[]).map(validateRow);
        setRows(parsed);
        setMode("upload");
      },
      error: (err) => toast.error("Parse error: " + err.message),
    });
  };

  const updateRow = (idx: number, field: keyof ParsedRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      next[idx] = validateRow({
        "Full Name": next[idx].full_name, Email: next[idx].email, Phone: next[idx].phone,
        Stage: next[idx].stage, Source: next[idx].source, "Estimated Value": next[idx].estimated_value,
        "Next Action": next[idx].next_action, Notes: next[idx].notes,
      }, idx);
      return next;
    });
  };

  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const doImport = async () => {
    setImporting(true); setProgress(0);
    let imported = 0, skipped = 0, updated = 0, errors = 0;

    const toProcess = rows.filter(r => skipInvalid ? r.errors.length === 0 : true);
    if (!skipInvalid && rows.some(r => r.errors.length)) {
      toast.error("Fix errors or enable skip invalid"); setImporting(false); return;
    }

    const BATCH = 100;
    for (let i = 0; i < toProcess.length; i += BATCH) {
      const batch = toProcess.slice(i, i + BATCH);
      const inserts: any[] = [];

      for (const r of batch) {
        if (r.duplicate) {
          if (duplicateAction === "skip") { skipped++; continue; }
          if (duplicateAction === "update") {
            const match = leads.find(l =>
              (r.email && l.email?.toLowerCase() === r.email.toLowerCase()) ||
              (r.phone && l.phone?.replace(/\D/g, "") === r.phone)
            );
            if (match) {
              const { error } = await supabase.from("coach_leads").update({
                full_name: r.full_name, email: r.email || null, phone: r.phone || null,
                stage: r.stage, source: r.source, estimated_value: r.estimated_value,
                next_action: r.next_action || null, notes: r.notes || null,
              }).eq("id", match.id);
              if (error) errors++; else updated++;
              continue;
            }
          }
        }
        inserts.push({
          coach_id: coachId, full_name: r.full_name, email: r.email || null, phone: r.phone || null,
          stage: r.stage, source: r.source, estimated_value: r.estimated_value,
          next_action: r.next_action || null, notes: r.notes || null,
        });
      }

      if (inserts.length) {
        const { error } = await supabase.from("coach_leads").insert(inserts);
        if (error) errors += inserts.length; else imported += inserts.length;
      }
      setProgress(Math.round(((i + batch.length) / toProcess.length) * 100));
    }

    setResult({ imported, skipped, updated, errors });
    setImporting(false);
    if (imported || updated) {
      toast.success(`${imported} leads imported successfully${updated ? `, ${updated} updated` : ""}`);
      onImported();
    }
  };

  const downloadCSV = (filename: string, data: any[]) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    downloadCSV("leads-template.csv", [HEADERS.reduce((a, h) => ({ ...a, [h]: "" }), {})]);
  };

  const exportLeads = () => {
    const filtered = exportStage === "all" ? leads : leads.filter(l => l.stage === exportStage);
    const data = filtered.map(l => ({
      "Full Name": l.full_name, Email: l.email || "", Phone: l.phone || "",
      Stage: l.stage, Source: l.source || "", "Estimated Value": l.estimated_value || 0,
      "Next Action": l.next_action || "", Notes: l.notes || "",
    }));
    downloadCSV(`leads-${exportStage}-${new Date().toISOString().slice(0, 10)}.csv`, data);
    toast.success(`${data.length} leads exported`);
    close();
  };

  const validCount = rows.filter(r => r.errors.length === 0).length;
  const errorCount = rows.length - validCount;
  const dupCount = rows.filter(r => r.duplicate).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "menu" ? "Import / Export Leads" : mode === "upload" ? "Preview & Import" : "Export Leads"}</DialogTitle>
          <DialogDescription>
            {mode === "menu" ? "Upload a CSV to bulk-add leads or download your existing pipeline." : ""}
          </DialogDescription>
        </DialogHeader>

        {mode === "menu" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="border border-border rounded-lg p-5 hover:border-primary transition cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Upload className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Upload CSV</h3>
              <p className="text-sm text-muted-foreground mt-1">Bulk import leads (max 10,000 rows)</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <div className="border border-border rounded-lg p-5 hover:border-primary transition cursor-pointer" onClick={() => setMode("export")}>
              <Download className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Download Leads</h3>
              <p className="text-sm text-muted-foreground mt-1">Export current pipeline ({leads.length} leads)</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="md:col-span-2">
              <FileText className="h-4 w-4 mr-2" /> Download CSV Template
            </Button>
          </div>
        )}

        {mode === "upload" && !result && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {validCount} valid</Badge>
              {errorCount > 0 && <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3 text-rose-500" /> {errorCount} errors</Badge>}
              {dupCount > 0 && <Badge variant="outline">{dupCount} duplicates</Badge>}
              <Badge variant="outline">{rows.length} total rows</Badge>
            </div>

            <div className="flex flex-wrap gap-3 items-center text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} />
                Skip invalid rows
              </label>
              {dupCount > 0 && (
                <div className="flex items-center gap-2">
                  <span>Duplicates:</span>
                  <Select value={duplicateAction} onValueChange={(v: any) => setDuplicateAction(v)}>
                    <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="create">Create new</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border border-border rounded-lg overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((r, i) => (
                    <TableRow key={i} className={r.errors.length ? "bg-destructive/5" : r.duplicate ? "bg-amber-500/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{r.rowIndex}</TableCell>
                      <TableCell><Input className="h-8" value={r.full_name} onChange={(e) => updateRow(i, "full_name", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8" value={r.email} onChange={(e) => updateRow(i, "email", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8" value={r.phone} onChange={(e) => updateRow(i, "phone", e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={r.stage} onValueChange={(v) => updateRow(i, "stage", v)}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{VALID_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" className="h-8 w-24" value={r.estimated_value} onChange={(e) => updateRow(i, "estimated_value", Number(e.target.value))} /></TableCell>
                      <TableCell>
                        {r.errors.length > 0 ? (
                          <span className="text-xs text-destructive">{r.errors.join(", ")}</span>
                        ) : r.duplicate ? (
                          <Badge variant="outline" className="text-xs">Duplicate</Badge>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeRow(i)}><X className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 10 && <p className="text-xs text-muted-foreground p-2 text-center">+ {rows.length - 10} more rows (preview shows first 10)</p>}
            </div>

            {importing && <Progress value={progress} />}

            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("menu")} disabled={importing}>Back</Button>
              <Button onClick={doImport} disabled={importing || rows.length === 0}>
                {importing ? `Importing... ${progress}%` : `Import ${skipInvalid ? validCount : rows.length} leads`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === "upload" && result && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-lg">Import Complete</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="border border-border rounded p-3"><div className="text-2xl font-bold text-emerald-500">{result.imported}</div><div className="text-xs text-muted-foreground">Imported</div></div>
              <div className="border border-border rounded p-3"><div className="text-2xl font-bold text-blue-500">{result.updated}</div><div className="text-xs text-muted-foreground">Updated</div></div>
              <div className="border border-border rounded p-3"><div className="text-2xl font-bold text-amber-500">{result.skipped}</div><div className="text-xs text-muted-foreground">Skipped</div></div>
              <div className="border border-border rounded p-3"><div className="text-2xl font-bold text-rose-500">{result.errors}</div><div className="text-xs text-muted-foreground">Errors</div></div>
            </div>
            <DialogFooter><Button onClick={close}>Done</Button></DialogFooter>
          </div>
        )}

        {mode === "export" && (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by stage</label>
              <Select value={exportStage} onValueChange={setExportStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages ({leads.length})</SelectItem>
                  {VALID_STAGES.map(s => (
                    <SelectItem key={s} value={s}>{s} ({leads.filter(l => l.stage === s).length})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("menu")}>Back</Button>
              <Button onClick={exportLeads}><Download className="h-4 w-4 mr-2" /> Download CSV</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
