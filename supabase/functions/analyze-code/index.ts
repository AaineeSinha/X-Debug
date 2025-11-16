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

interface Issue {
  severity: string;
  message: string;
  line: number;
  type: string;
  beginnerExplanation: string;
  solutions: Array<{
    title: string;
    description: string;
    code: string;
    difficulty: string;
  }>;
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
          beginnerExplanation: "Hey! In Python, it's best practice to put all your import statements at the very top of your file. This makes your code more organized and helps Python load everything it needs right away.",
          solutions: [
            {
              title: "Move import to top",
              description: "Simply cut this import line and paste it at the very beginning of your file, before any other code.",
              code: line.trim(),
              difficulty: "Easy"
            },
            {
              title: "Group with other imports",
              description: "If you have other imports, add this one with them at the top. Keep standard library imports first, then third-party imports.",
              code: `# At the top of your file\n${line.trim()}\n# ... other imports`,
              difficulty: "Easy"
            }
          ]
        });
      }
      if (line.match(/\bprint\(/)) {
        issues.push({
          severity: 'info',
          message: 'Consider using logging instead of print statements',
          line: idx + 1,
          type: 'style',
          beginnerExplanation: "Print statements are great for quick debugging, but for production code, using Python's logging module is much better! It lets you control when messages appear and saves them to files.",
          solutions: [
            {
              title: "Keep print (Beginner-friendly)",
              description: "For learning and simple scripts, print() is totally fine! You can keep it as is.",
              code: line.trim(),
              difficulty: "Easy"
            },
            {
              title: "Use logging module",
              description: "Import logging at the top and use logging.info() instead. This is more professional and flexible.",
              code: line.replace(/print\((.*)\)/, 'logging.info($1)'),
              difficulty: "Intermediate"
            },
            {
              title: "Add debug logging",
              description: "Use logging.debug() for development messages that you can turn off in production.",
              code: line.replace(/print\((.*)\)/, 'logging.debug($1)'),
              difficulty: "Intermediate"
            }
          ]
        });
      }
      if (line.match(/except:/)) {
        issues.push({
          severity: 'warning',
          message: 'Bare except clause catches all exceptions',
          line: idx + 1,
          type: 'error-handling',
          beginnerExplanation: "Using 'except:' without specifying an error type is risky! It catches ALL errors, even ones you didn't expect. This can hide bugs and make debugging harder.",
          solutions: [
            {
              title: "Catch specific exception",
              description: "Replace 'except:' with a specific error type like 'except ValueError:' to only catch the errors you expect.",
              code: line.replace(/except:/, 'except ValueError:'),
              difficulty: "Easy"
            },
            {
              title: "Catch multiple exceptions",
              description: "You can catch multiple specific error types using a tuple.",
              code: line.replace(/except:/, 'except (ValueError, TypeError):'),
              difficulty: "Intermediate"
            },
            {
              title: "Use Exception base class",
              description: "If you really need to catch most errors, use 'except Exception:' - this is safer than bare except.",
              code: line.replace(/except:/, 'except Exception as e:'),
              difficulty: "Easy"
            }
          ]
        });
      }
      if (line.match(/==\s*None/) || line.match(/None\s*==/)) {
        issues.push({
          severity: 'warning',
          message: 'Use "is None" instead of "== None"',
          line: idx + 1,
          type: 'style',
          beginnerExplanation: "In Python, when checking if something is None, it's better to use 'is None' instead of '== None'. This is because 'is' checks if they're the exact same object in memory, which is what you want for None!",
          solutions: [
            {
              title: "Use 'is None'",
              description: "Replace '== None' with 'is None' for proper None checking.",
              code: line.replace(/==\s*None/, 'is None').replace(/None\s*==/, 'is None'),
              difficulty: "Easy"
            }
          ]
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
          beginnerExplanation: "The gets() function is super dangerous! It doesn't check how much data you're reading, which means someone could send way too much data and crash your program or even hack it. Always use fgets() instead!",
          solutions: [
            {
              title: "Replace with fgets()",
              description: "Use fgets() which lets you set a maximum size. Much safer!",
              code: line.replace(/gets\((.*?)\)/, 'fgets($1, sizeof($1), stdin)'),
              difficulty: "Easy"
            },
            {
              title: "Use scanf with width",
              description: "Another option is scanf() with a width specifier to limit input size.",
              code: line.replace(/gets\((.*?)\)/, 'scanf("%99s", $1)  // Adjust 99 to your buffer size'),
              difficulty: "Easy"
            }
          ]
        });
      }
      if (line.includes('malloc') && !code.includes('free')) {
        issues.push({
          severity: 'warning',
          message: 'Potential memory leak: malloc without corresponding free',
          line: idx + 1,
          type: 'runtime',
          beginnerExplanation: "When you allocate memory with malloc(), you need to free() it when you're done! Think of it like borrowing a book from the library - you have to return it. If you don't, your program will eat up more and more memory.",
          solutions: [
            {
              title: "Add free() call",
              description: "Add a free() statement when you're done using the memory.",
              code: `${line.trim()}\n// ... use the pointer ...\nfree(${line.match(/(\w+)\s*=/)?.[1] || 'ptr'});`,
              difficulty: "Easy"
            },
            {
              title: "Check malloc first, then free",
              description: "Always check if malloc succeeded before using memory, then free it.",
              code: `${line.trim()}\nif (ptr == NULL) return -1;\n// Use memory\nfree(ptr);`,
              difficulty: "Intermediate"
            }
          ]
        });
      }
      if (line.match(/=\s*NULL/) && !line.includes('free')) {
        issues.push({
          severity: 'info',
          message: 'Pointer set to NULL without freeing memory',
          line: idx + 1,
          type: 'runtime',
          beginnerExplanation: "You're setting a pointer to NULL, but did you free the memory it was pointing to first? If not, that memory is now lost forever (memory leak)! Always free() before setting to NULL.",
          solutions: [
            {
              title: "Free before NULL",
              description: "Call free() on the pointer before setting it to NULL.",
              code: `free(${line.split('=')[0].trim()});\n${line.trim()}`,
              difficulty: "Easy"
            }
          ]
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