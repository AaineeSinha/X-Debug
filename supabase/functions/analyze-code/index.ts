import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, filename } = await req.json();
    
    console.log('Analyzing code:', { language, filename, codeLength: code.length });

    // Static Analysis
    const staticIssues = analyzeStaticIssues(code, language);
    
    // Runtime Trace (simplified)
    const runtimeTrace = analyzeRuntime(code, language);
    
    // AI Score (mock - would use real AI in production)
    const aiScore = calculateAIScore(staticIssues);
    
    // Root Cause Analysis
    const rootCause = generateRootCause(staticIssues);
    
    // Suggestions
    const suggestions = generateSuggestions(staticIssues, code, language);
    
    // Alternative Fixes with confidence scores
    const alternativeFixes = generateAlternativeFixes(staticIssues, code, language);
    
    // Causal Graph
    const causalGraph = generateCausalGraph(code, language);

    // Save to database
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        await supabase.from('code_history').insert({
          user_id: userData.user.id,
          filename,
          language,
          code,
          static_issues: staticIssues,
          runtime_trace: runtimeTrace,
          ai_score: aiScore,
          root_cause: rootCause,
          suggestions,
          alternative_fixes: alternativeFixes,
          causal_graph: causalGraph,
        });
      }
    }

    return new Response(
      JSON.stringify({
        staticIssues,
        runtimeTrace,
        aiScore,
        rootCause,
        suggestions,
        alternativeFixes,
        causalGraph,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in analyze-code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface Issue {
  severity: string;
  message: string;
  line: number;
  type: string;
}

function analyzeStaticIssues(code: string, language: string): Issue[] {
  const issues: Issue[] = [];
  const lines = code.split('\n');

  if (language === 'python') {
    lines.forEach((line, idx) => {
      // Check for common Python issues
      if (line.includes('import ') && !line.trim().startsWith('import') && !line.trim().startsWith('from')) {
        issues.push({
          severity: 'warning',
          message: 'Import statement should be at the top of the file',
          line: idx + 1,
          type: 'syntax',
        });
      }
      if (line.match(/\bprint\(/)) {
        issues.push({
          severity: 'info',
          message: 'Consider using logging instead of print statements',
          line: idx + 1,
          type: 'style',
        });
      }
      if (line.match(/except:/)) {
        issues.push({
          severity: 'warning',
          message: 'Bare except clause catches all exceptions',
          line: idx + 1,
          type: 'logic',
        });
      }
      if (line.match(/==\s*None/) || line.match(/None\s*==/)) {
        issues.push({
          severity: 'warning',
          message: 'Use "is None" instead of "== None"',
          line: idx + 1,
          type: 'style',
        });
      }
    });
  } else if (language === 'c') {
    lines.forEach((line, idx) => {
      if (line.includes('gets(')) {
        issues.push({
          severity: 'error',
          message: 'gets() is unsafe, use fgets() instead',
          line: idx + 1,
          type: 'security',
        });
      }
      if (line.includes('malloc') && !code.includes('free')) {
        issues.push({
          severity: 'warning',
          message: 'Potential memory leak: malloc without corresponding free',
          line: idx + 1,
          type: 'runtime',
        });
      }
      if (line.match(/=\s*NULL/) && !line.includes('free')) {
        issues.push({
          severity: 'info',
          message: 'Pointer set to NULL without freeing memory',
          line: idx + 1,
          type: 'runtime',
        });
      }
    });
  }

  return issues;
}

function analyzeRuntime(code: string, language: string) {
  return {
    variables: ['x', 'y', 'result'],
    executionPath: ['line 1', 'line 5', 'line 10'],
    memoryUsage: '2.4 MB',
  };
}

function calculateAIScore(issues: any[]) {
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  const score = Math.min(1, (errorCount * 0.3 + warningCount * 0.1));
  return parseFloat(score.toFixed(2));
}

function generateRootCause(issues: any[]) {
  if (issues.length === 0) {
    return 'No significant issues detected in the code.';
  }
  
  const criticalIssue = issues.find(i => i.severity === 'error') || issues[0];
  return `Primary issue: ${criticalIssue.message} at line ${criticalIssue.line}. This could lead to ${criticalIssue.type} problems.`;
}

function generateSuggestions(issues: any[], code: string, language: string) {
  const suggestions = [];
  
  issues.forEach(issue => {
    if (issue.message.includes('gets()')) {
      suggestions.push({
        title: 'Replace gets() with fgets()',
        description: 'Use fgets(buffer, size, stdin) for safe input',
        priority: 'high',
      });
    } else if (issue.message.includes('malloc')) {
      suggestions.push({
        title: 'Add free() for allocated memory',
        description: 'Ensure every malloc() has a corresponding free()',
        priority: 'medium',
      });
    } else if (issue.message.includes('print')) {
      suggestions.push({
        title: 'Use logging module',
        description: 'Import logging and use logging.info() instead',
        priority: 'low',
      });
    }
  });

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Code looks good',
      description: 'No major improvements needed',
      priority: 'low',
    });
  }

  return suggestions;
}

interface AlternativeFix {
  line: number;
  original: string;
  alternatives: Array<{
    fix: string;
    confidence: number;
    explanation: string;
  }>;
}

function generateAlternativeFixes(issues: Issue[], code: string, language: string): AlternativeFix[] {
  const fixes: AlternativeFix[] = [];
  const lines = code.split('\n');

  issues.forEach(issue => {
    const originalLine = lines[issue.line - 1];
    const alternatives = [];

    if (issue.message.includes('gets()')) {
      alternatives.push({
        fix: originalLine.replace('gets(', 'fgets('),
        confidence: 0.95,
        explanation: 'Replace with fgets for buffer overflow protection',
      });
    } else if (issue.message.includes('print')) {
      alternatives.push({
        fix: originalLine.replace('print(', 'logging.info('),
        confidence: 0.85,
        explanation: 'Use logging for better control',
      });
    } else if (issue.message.includes('== None')) {
      alternatives.push({
        fix: originalLine.replace('== None', 'is None'),
        confidence: 0.98,
        explanation: 'Python best practice for None comparison',
      });
    }

    if (alternatives.length > 0) {
      fixes.push({
        line: issue.line,
        original: originalLine.trim(),
        alternatives,
      });
    }
  });

  return fixes;
}

function generateCausalGraph(code: string, language: string) {
  return {
    nodes: [
      { id: 'input', label: 'User Input', type: 'source' },
      { id: 'process', label: 'Processing', type: 'logic' },
      { id: 'output', label: 'Output', type: 'sink' },
    ],
    edges: [
      { from: 'input', to: 'process', label: 'data flow' },
      { from: 'process', to: 'output', label: 'result' },
    ],
  };
}