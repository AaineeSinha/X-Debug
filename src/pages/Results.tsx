import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CheckCircle, Info } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { code, language } = location.state || {};

  if (!code) {
    navigate("/dashboard");
    return null;
  }

  // Mock results for demonstration
  const mockResults = {
    staticIssues: [
      { severity: "error", message: "Variable 'x' used before assignment", line: 5 },
      { severity: "warning", message: "Unused import 'os'", line: 1 },
    ],
    aiScore: 0.75,
    rootCause: "The variable 'x' is referenced before being initialized, which will cause a NameError at runtime.",
    suggestions: [
      "Initialize variable 'x' before using it",
      "Add error handling for undefined variables",
      "Use default values for optional variables",
    ],
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold glow-text mb-8">Analysis Results</h1>

        <div className="space-y-6">
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-primary">AI Defect Score</span>
              <Badge variant={mockResults.aiScore > 0.7 ? "destructive" : "outline"}>
                {(mockResults.aiScore * 100).toFixed(0)}%
              </Badge>
            </h2>
            <p className="text-muted-foreground">{mockResults.rootCause}</p>
          </Card>

          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Static Analysis Issues</h2>
            <div className="space-y-3">
              {mockResults.staticIssues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <p className="font-medium">{issue.message}</p>
                    <p className="text-sm text-muted-foreground">Line {issue.line}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
            <div className="space-y-2">
              {mockResults.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <p>{suggestion}</p>
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
