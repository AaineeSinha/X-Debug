import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, AlertCircle, CheckCircle, Info, Download, Copy, Check, ChevronDown, Wand2, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { AIAssistant } from "@/components/AIAssistant";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    code, 
    language, 
    filename,
    staticIssues = [],
    runtimeTrace,
    aiScore = 0,
    rootCause = "",
    suggestions = [],
    alternativeFixes = [],
    correctedCode = "",
    causalGraph,
  } = location.state || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const [copiedFix, setCopiedFix] = useState<string | null>(null);
  const [copiedFullCode, setCopiedFullCode] = useState(false);

  if (!code) {
    navigate("/dashboard");
    return null;
  }

  const handleExport = async (format: 'txt' | 'pdf') => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-report', {
        body: {
          format,
          data: {
            code,
            language,
            filename,
            staticIssues,
            aiScore,
            rootCause,
            suggestions,
            alternativeFixes,
          }
        }
      });

      if (error) throw error;

      // Create download
      const blob = new Blob([data], { type: format === 'pdf' ? 'application/pdf' : 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-report-${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyFix = async (fix: string, id: string) => {
    await navigator.clipboard.writeText(fix);
    setCopiedFix(id);
    toast.success('Fix copied to clipboard');
    setTimeout(() => setCopiedFix(null), 2000);
  };

  const handleApplyFix = (solutionCode: string, lineNumber: number) => {
    const lines = code.split('\n');
    lines[lineNumber - 1] = solutionCode;
    const updatedCode = lines.join('\n');
    
    navigate('/dashboard', {
      state: {
        code: updatedCode,
        language,
        filename,
      }
    });
    toast.success('Fix applied! Code updated in editor.');
  };

  const handleReplaceAll = () => {
    let updatedCode = code;
    const lines = updatedCode.split('\n');
    
    staticIssues.forEach((issue: any) => {
      if (issue.solutions && issue.solutions[0]) {
        lines[issue.line - 1] = issue.solutions[0].code;
      }
    });
    
    updatedCode = lines.join('\n');
    
    navigate('/dashboard', {
      state: {
        code: updatedCode,
        language,
        filename,
      }
    });
    toast.success('All fixes applied! Code updated in editor.');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <Info className="w-5 h-5 text-warning" />;
      default:
        return <CheckCircle className="w-5 h-5 text-success" />;
    }
  };

  const filteredIssues = staticIssues.filter((issue: any) => {
    const matchesSearch = issue.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || issue.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('txt')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Export TXT
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold glow-text mb-8">
          Analysis Results - {filename}
        </h1>

        <div className="space-y-6">
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-primary">AI Defect Score</span>
              <Badge variant={aiScore > 0.5 ? "destructive" : "outline"}>
                {(aiScore * 100).toFixed(0)}%
              </Badge>
            </h2>
            <p className="text-muted-foreground">{rootCause}</p>
          </Card>

        {/* Static Issues with Solutions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Issues Found</h2>
            <Badge variant="outline">{filteredIssues.length} issues</Badge>
          </div>

          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Tabs value={filterType} onValueChange={setFilterType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="syntax">Syntax</TabsTrigger>
                <TabsTrigger value="runtime">Runtime</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-4">
            {filteredIssues.map((issue: any, idx: number) => (
              <Card key={idx} className="p-4 border-l-4" style={{
                borderLeftColor: 
                  issue.severity === "error" ? "hsl(var(--destructive))" :
                  issue.severity === "warning" ? "hsl(var(--warning))" :
                  "hsl(var(--success))"
              }}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{issue.type}</Badge>
                        <Badge variant="secondary">Line {issue.line}</Badge>
                        <Badge 
                          variant={
                            issue.severity === "error" ? "destructive" :
                            issue.severity === "warning" ? "default" :
                            "secondary"
                          }
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-2">{issue.message}</p>
                      {issue.beginnerExplanation && (
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          💡 {issue.beginnerExplanation}
                        </p>
                      )}
                    </div>

                    {issue.solutions && issue.solutions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          🔧 {issue.solutions.length} Solution{issue.solutions.length > 1 ? 's' : ''}:
                        </p>
                        {issue.solutions.map((solution: any, sIdx: number) => (
                          <Collapsible key={sIdx}>
                            <Card className="bg-muted/50">
                              <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/80 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {solution.difficulty}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {sIdx + 1}. {solution.title}
                                  </span>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 pt-0">
                                <p className="text-sm text-muted-foreground mb-3">
                                  {solution.description}
                                </p>
                                <div className="bg-background p-3 rounded border border-border font-mono text-xs mb-3">
                                  <pre className="whitespace-pre-wrap">{solution.code}</pre>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApplyFix(solution.code, issue.line)}
                                    className="flex-1"
                                  >
                                    <Wand2 className="w-3 h-3 mr-1" />
                                    Apply This Fix
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyFix(solution.code, `${idx}-${sIdx}`)}
                                  >
                                    {copiedFix === `${idx}-${sIdx}` ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* AI Assistant Chatbot */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Ask AI Assistant</h2>
          <AIAssistant />
        </div>

          {alternativeFixes.length > 0 && (
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Smart Fix Suggestions</h2>
              <div className="space-y-6">
                {alternativeFixes.map((fix: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4 bg-muted/20">
                    <div className="mb-3">
                      <Badge variant="outline" className="mb-2">Line {fix.line}</Badge>
                      <div className="font-mono text-sm bg-destructive/10 p-2 rounded">
                        <span className="text-muted-foreground">Original:</span> {fix.original}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {fix.alternatives.map((alt: any, altIdx: number) => (
                        <div key={altIdx} className="bg-success/10 p-3 rounded-lg">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">
                                  {(alt.confidence * 100).toFixed(0)}% confidence
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {alt.explanation}
                                </span>
                              </div>
                              <div className="font-mono text-sm">
                                {alt.fix}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyFix(alt.fix, `${idx}-${altIdx}`)}
                              >
                                {copiedFix === `${idx}-${altIdx}` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApplyFix(fix.original, alt.fix)}
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
            <div className="space-y-2">
              {suggestions.map((suggestion: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{suggestion.title || suggestion}</p>
                    {suggestion.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Results;
