import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Play, LogOut } from "lucide-react";

const Dashboard = () => {
  const [language, setLanguage] = useState<"python" | "c">("python");
  const [code, setCode] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setAnalyzing(true);
    try {
      // Mock analysis for now - we'll implement the real Edge Function next
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate("/results", { state: { code, language } });
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold glow-text">X-Debug</h1>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
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

              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${language === "python" ? "Python" : "C"} code here...`}
                className="font-mono min-h-[400px] bg-input/50"
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
