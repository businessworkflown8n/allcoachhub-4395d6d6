import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, ClipboardPaste, AlertTriangle, CheckCircle, X, Users } from "lucide-react";
import * as XLSX from "xlsx";

export type ImportedContact = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  whatsapp_number?: string;
  company?: string;
  role?: string;
  tags?: string[];
  is_valid: boolean;
  is_duplicate: boolean;
  validation_errors: string[];
};

type FieldMapping = Record<string, string>;

const TARGET_FIELDS = [
  { value: "skip", label: "Skip / Ignore" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "country_code", label: "Country Code" },
  { value: "whatsapp_number", label: "WhatsApp Number" },
  { value: "company", label: "Company" },
  { value: "role", label: "Role" },
  { value: "tags", label: "Tags" },
];

const AUTO_MAP: Record<string, string> = {
  email: "email", mail: "email", "e-mail": "email", "email address": "email",
  name: "full_name", "full name": "full_name", fullname: "full_name",
  "first name": "first_name", firstname: "first_name", fname: "first_name", "first": "first_name",
  "last name": "last_name", lastname: "last_name", lname: "last_name", "last": "last_name",
  phone: "phone", mobile: "phone", "phone number": "phone", tel: "phone", telephone: "phone",
  "country code": "country_code", countrycode: "country_code", country: "country_code",
  whatsapp: "whatsapp_number", "whatsapp number": "whatsapp_number",
  company: "company", organization: "company", org: "company",
  role: "role", title: "role", "job title": "role", designation: "role",
  tags: "tags", tag: "tags",
};

type Props = {
  channel: string;
  onImportComplete: (contacts: ImportedContact[], summary: ImportSummary) => void;
  onCancel: () => void;
};

export type ImportSummary = {
  totalRows: number;
  validContacts: number;
  invalidContacts: number;
  duplicateContacts: number;
  missingMandatory: number;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;

export const CampaignContactImport = ({ channel, onImportComplete, onCancel }: Props) => {
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [contacts, setContacts] = useState<ImportedContact[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState("");

  const parseFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      if (!json.length) { toast.error("File is empty"); return; }
      const cols = Object.keys(json[0]);
      setHeaders(cols);
      setRawData(json);
      const autoMap: FieldMapping = {};
      cols.forEach(c => {
        const key = c.toLowerCase().trim();
        if (AUTO_MAP[key]) autoMap[c] = AUTO_MAP[key];
        else autoMap[c] = "skip";
      });
      setMapping(autoMap);
      setStep("mapping");
    } catch {
      toast.error("Failed to parse file");
    }
  }, []);

  const handlePaste = () => {
    if (!pasteText.trim()) { toast.error("No data to import"); return; }
    const lines = pasteText.trim().split("\n").map(l => l.split("\t").length > 1 ? l.split("\t") : l.split(","));
    if (lines.length < 2) { toast.error("Need at least a header row and one data row"); return; }
    const cols = lines[0].map(h => h.trim());
    const json = lines.slice(1).map(row => {
      const obj: Record<string, string> = {};
      cols.forEach((c, i) => { obj[c] = (row[i] || "").trim(); });
      return obj;
    });
    setHeaders(cols);
    setRawData(json);
    setFileName("pasted_data");
    const autoMap: FieldMapping = {};
    cols.forEach(c => {
      const key = c.toLowerCase().trim();
      autoMap[c] = AUTO_MAP[key] || "skip";
    });
    setMapping(autoMap);
    setStep("mapping");
  };

  const processContacts = () => {
    const seen = new Set<string>();
    const result: ImportedContact[] = [];
    let invalid = 0, dupes = 0, missing = 0;

    rawData.forEach(row => {
      const contact: ImportedContact = { is_valid: true, is_duplicate: false, validation_errors: [] };
      Object.entries(mapping).forEach(([col, field]) => {
        if (field === "skip") return;
        const val = row[col]?.toString().trim() || "";
        if (field === "tags") (contact as any)[field] = val.split(",").map((t: string) => t.trim()).filter(Boolean);
        else (contact as any)[field] = val;
      });

      // Build full_name from parts if missing
      if (!contact.full_name && (contact.first_name || contact.last_name)) {
        contact.full_name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
      }

      // Validate based on channel
      const errors: string[] = [];
      if (channel === "email") {
        if (!contact.email) { errors.push("Missing email"); missing++; }
        else if (!emailRegex.test(contact.email)) errors.push("Invalid email format");
      } else if (channel === "whatsapp") {
        const num = contact.whatsapp_number || contact.phone;
        if (!num) { errors.push("Missing phone/WhatsApp"); missing++; }
        else if (!phoneRegex.test(num)) errors.push("Invalid phone format");
      } else if (channel === "sms") {
        const num = contact.phone || contact.whatsapp_number;
        if (!num) { errors.push("Missing phone"); missing++; }
        else if (!phoneRegex.test(num)) errors.push("Invalid phone format");
      }

      contact.validation_errors = errors;
      contact.is_valid = errors.length === 0;
      if (!contact.is_valid) invalid++;

      // Dedup
      const key = channel === "email" ? contact.email : (contact.whatsapp_number || contact.phone || contact.email);
      if (key && seen.has(key.toLowerCase())) {
        contact.is_duplicate = true;
        dupes++;
      } else if (key) {
        seen.add(key.toLowerCase());
      }

      result.push(contact);
    });

    const validCount = result.filter(c => c.is_valid && !c.is_duplicate).length;
    const s: ImportSummary = {
      totalRows: rawData.length,
      validContacts: validCount,
      invalidContacts: invalid,
      duplicateContacts: dupes,
      missingMandatory: missing,
    };
    setContacts(result);
    setSummary(s);
    setStep("preview");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  if (step === "upload") {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Import Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pasteMode ? (
            <>
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById("campaign-file-input")?.click()}
              >
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Drag & drop a CSV or Excel file, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supported: .csv, .xlsx, .xls</p>
                <input id="campaign-file-input" type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])} />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => setPasteMode(true)}>
                <ClipboardPaste className="h-4 w-4" /> Paste Data
              </Button>
            </>
          ) : (
            <>
              <Label>Paste your data (CSV or tab-separated with headers)</Label>
              <Textarea rows={8} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder={"Name,Email,Phone\nJohn,john@example.com,+1234567890"} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPasteMode(false)}>Back</Button>
                <Button onClick={handlePaste}>Process Data</Button>
              </div>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">Cancel</Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "mapping") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Map Columns
            <Badge variant="outline" className="ml-auto">{rawData.length} rows</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Map your file columns to contact fields. Unmapped columns will be skipped.</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {headers.map(h => (
              <div key={h} className="flex items-center gap-3">
                <span className="text-sm font-medium w-1/3 truncate" title={h}>{h}</span>
                <span className="text-muted-foreground">→</span>
                <Select value={mapping[h] || "skip"} onValueChange={v => setMapping(prev => ({ ...prev, [h]: v }))}>
                  <SelectTrigger className="w-2/3"><SelectValue /></SelectTrigger>
                  <SelectContent>{TARGET_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p><strong>Channel:</strong> {channel.toUpperCase()}</p>
            <p>{channel === "email" ? "Email field is required" : "Phone/WhatsApp field is required"}</p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
            <Button onClick={processContacts}>Validate & Preview</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview step
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Import Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground">{summary.totalRows}</p>
              <p className="text-xs text-muted-foreground">Total Rows</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-500">{summary.validContacts}</p>
              <p className="text-xs text-muted-foreground">Valid</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-red-500">{summary.invalidContacts}</p>
              <p className="text-xs text-muted-foreground">Invalid</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-yellow-500">{summary.duplicateContacts}</p>
              <p className="text-xs text-muted-foreground">Duplicates</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-orange-500">{summary.missingMandatory}</p>
              <p className="text-xs text-muted-foreground">Missing Required</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{summary.validContacts}</p>
              <p className="text-xs text-muted-foreground">Will Send To</p>
            </div>
          </div>
        )}
        {/* Sample preview */}
        <div className="max-h-[200px] overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">{channel === "email" ? "Email" : "Phone"}</th>
                <th className="p-2 text-left">Issues</th>
              </tr>
            </thead>
            <tbody>
              {contacts.slice(0, 50).map((c, i) => (
                <tr key={i} className={`border-t ${!c.is_valid ? "bg-destructive/5" : c.is_duplicate ? "bg-yellow-500/5" : ""}`}>
                  <td className="p-2">
                    {c.is_valid && !c.is_duplicate ? <CheckCircle className="h-3 w-3 text-green-500" /> :
                     c.is_duplicate ? <AlertTriangle className="h-3 w-3 text-yellow-500" /> :
                     <X className="h-3 w-3 text-red-500" />}
                  </td>
                  <td className="p-2">{c.full_name || c.first_name || "—"}</td>
                  <td className="p-2">{channel === "email" ? c.email : (c.whatsapp_number || c.phone) || "—"}</td>
                  <td className="p-2 text-destructive">{c.validation_errors.join(", ") || (c.is_duplicate ? "Duplicate" : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => setStep("mapping")}>Back</Button>
          <Button onClick={() => onImportComplete(contacts, summary!)} disabled={!summary?.validContacts}>
            Import {summary?.validContacts || 0} Contacts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
