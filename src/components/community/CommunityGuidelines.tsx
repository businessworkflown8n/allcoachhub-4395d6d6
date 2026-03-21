import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Heart, Ban, AlertTriangle, FileText, Scale } from "lucide-react";

const guidelines = [
  { icon: Heart, title: "Be Respectful", description: "Treat all community members with respect. No personal attacks, name-calling, or harassment. We are here to learn and grow together." },
  { icon: Ban, title: "No Spam or Self-Promotion", description: "Do not post spam, excessive self-promotion, or irrelevant content. Share value first, promote second." },
  { icon: FileText, title: "No Plagiarism", description: "Always credit original sources. Do not copy content from others without attribution. Share your own insights and experiences." },
  { icon: AlertTriangle, title: "No Hate or Abuse", description: "Zero tolerance for hate speech, discrimination, bullying, or abuse of any kind. This includes racism, sexism, and all forms of bigotry." },
  { icon: Shield, title: "No Unsafe AI Content", description: "Do not share prompts or content designed to generate harmful, misleading, or dangerous AI outputs. Promote responsible AI use." },
  { icon: Scale, title: "No Misleading Promotions", description: "Do not make false claims about AI tools, courses, or services. Be honest about capabilities and limitations." },
];

const CommunityGuidelines = () => (
  <div className="space-y-6 max-w-3xl">
    <div>
      <h2 className="text-xl font-bold text-foreground">Community Guidelines</h2>
      <p className="text-sm text-muted-foreground mt-1">Our community thrives when everyone follows these principles. Please read and respect these guidelines.</p>
    </div>

    <div className="space-y-4">
      {guidelines.map((g, i) => {
        const Icon = g.icon;
        return (
          <Card key={i}>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{g.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>

    <Card className="border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Reporting & Consequences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>If you encounter content that violates these guidelines, use the <strong className="text-foreground">Report</strong> button on any post, comment, or prompt.</p>
        <p>Reports are reviewed by our moderation team. Consequences for violations include:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>First offense: Warning</li>
          <li>Second offense: Temporary posting suspension</li>
          <li>Severe or repeated violations: Permanent community ban</li>
        </ul>
        <p className="pt-2">Our goal is to keep this community safe, supportive, and focused on learning AI together.</p>
      </CardContent>
    </Card>
  </div>
);

export default CommunityGuidelines;
