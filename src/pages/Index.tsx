import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bug, Brain, GitBranch, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl md:text-7xl font-bold glow-text mb-4">
            X-Debug
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            AI-Powered Reverse Debugger using Expert Systems, NLP and Machine Learning
          </p>

          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => navigate("/auth")} className="animate-glow">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="glass-card p-6 rounded-xl">
              <Bug className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Static Analysis</h3>
              <p className="text-sm text-muted-foreground">
                AST-based analysis for Python and rule-based detection for C
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <Brain className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">AI Defect Detection</h3>
              <p className="text-sm text-muted-foreground">
                CodeBERT-powered defect probability scoring
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <GitBranch className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Causal Graph Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Visualize cause-effect relationships in your code
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
