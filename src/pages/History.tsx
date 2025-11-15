import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Code2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  filename: string;
  language: string;
  code: string;
  ai_score: number;
  created_at: string;
  static_issues: any;
  suggestions: any;
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('code_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('code_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(history.filter(item => item.id !== id));
      toast.success('History item deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReload = (item: HistoryItem) => {
    navigate('/dashboard', {
      state: {
        code: item.code,
        language: item.language,
        filename: item.filename,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl glow-text">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold glow-text mb-8">Analysis History</h1>

        {history.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Code2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No analysis history yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Run your first code analysis to see it here
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <Card key={item.id} className="glass-card p-6 hover:border-primary/50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{item.filename}</h3>
                      <Badge variant="outline" className="uppercase">
                        {item.language}
                      </Badge>
                      <Badge
                        variant={item.ai_score > 0.5 ? "destructive" : "outline"}
                      >
                        Score: {(item.ai_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(item.created_at), 'PPp')}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {item.static_issues?.length || 0} issues found •{' '}
                      {item.suggestions?.length || 0} suggestions
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReload(item)}
                    >
                      <Code2 className="w-4 h-4 mr-2" />
                      Reload
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;