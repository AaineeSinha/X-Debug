import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Play, LogOut, History, Moon, Sun } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { ThemeToggle } from "@/components/ThemeToggle";

const Dashboard = () => {
  const [language, setLanguage] = useState<"python" | "c">("python");
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();

    // Load code from history if passed via navigation state
    if (location.state?.code) {
      setCode(location.state.code);
      setLanguage(location.state.language || "python");
      setFilename(location.state.filename || "");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error("Please enter or upload code to analyze");
      return;
    }

    if (!filename.trim()) {
      toast.error("Please enter a filename");
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { 
          code, 
          language,
          filename,
        }
      });

      if (error) throw error;

      // Update inline errors
      setErrors(data.staticIssues || []);

      navigate("/results", { 
        state: { 
          code, 
          language,
          filename,
          ...data 
        } 
      });
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold glow-text">X-Debug</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={() => navigate("/history")}>
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold mb-3 block">Select Language</Label>
              <Tabs value={language} onValueChange={(v) => setLanguage(v as "python" | "c")}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="python">Python (.py)</TabsTrigger>
                  <TabsTrigger value="c">C (.c)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="text-lg font-semibold mb-3 block">Filename</Label>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={`example.${language === "python" ? "py" : "c"}`}
                className="mb-4"
              />
            </div>

            <div>
              <Label className="text-lg font-semibold mb-3 block">Upload or Paste Code</Label>
              <div className="flex gap-3 mb-4">
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                    <input
                      type="file"
                      accept={language === "python" ? ".py" : ".c"}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>

              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                errors={errors}
              />
            </div>

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full md:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              {analyzing ? "Analyzing..." : "Analyze Code"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
