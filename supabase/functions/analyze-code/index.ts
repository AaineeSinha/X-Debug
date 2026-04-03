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

  // Helper function to extract variable names from a line
  const extractVariables = (line: string): string[] => {
    const varPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = line.match(varPattern) || [];
    return matches.filter(v => !['print', 'if', 'else', 'for', 'while', 'def', 'class', 'import', 'from', 'return', 'try', 'except', 'finally', 'with', 'as', 'malloc', 'free', 'sizeof', 'NULL'].includes(v));
  };

  if (language === 'python') {
    lines.forEach((line, idx) => {
      // Check for common Python issues
      const lineVars = extractVariables(line);
      const varContext = lineVars.length > 0 ? ` (working with: ${lineVars.slice(0, 3).join(', ')})` : '';
      
      if (line.includes('import ') && !line.trim().startsWith('import') && !line.trim().startsWith('from')) {
        issues.push({
          severity: 'warning',
          message: 'Import statement should be at the top of the file',
          line: idx + 1,
          type: 'syntax',
          beginnerExplanation: `Hey there! 👋 I noticed you have an import statement in the middle of your code${varContext}. In Python, it's like organizing your tools - you want all your imports at the very top of your file! This helps Python load everything it needs right from the start and makes your code super organized.`,
          solutions: [
            {
              title: "✨ Move import to top (Recommended)",
              description: `Cut this line: "${line.trim()}" and paste it at the very beginning of your file, right at line 1 or right after your other imports.`,
              code: line.trim(),
              difficulty: "Easy"
            },
            {
              title: "📚 Group with other imports",
              description: "If you have other imports, add this one with them at the top. Pro tip: Keep standard library imports first, then third-party imports!",
              code: `# At the top of your file\n${line.trim()}\n# ... rest of your imports`,
              difficulty: "Easy"
            },
            {
              title: "🔧 Keep it here (Not recommended)",
              description: "You can technically keep it here, but it's not a good practice and might confuse other programmers reading your code.",
              code: line.trim(),
              difficulty: "Easy"
            }
          ]
        });
      }
      if (line.match(/\bprint\(/)) {
        const printContent = line.match(/print\((.*)\)/)?.[1] || 'something';
        issues.push({
          severity: 'info',
          message: `Found print statement${varContext}`,
          line: idx + 1,
          type: 'style',
          beginnerExplanation: `I see you're printing ${printContent}${varContext}! Print statements are awesome for learning and quick debugging 🎯. For bigger projects though, Python's logging module is like print() but with superpowers - it can save messages to files, let you turn them on/off, and helps you debug way better!`,
          solutions: [
            {
              title: "✅ Keep print (Perfect for learning!)",
              description: `For learning and simple scripts, this print() is totally fine! Your code: "${line.trim()}" works great as is.`,
              code: line.trim(),
              difficulty: "Easy"
            },
            {
              title: "📝 Upgrade to logging.info()",
              description: `This is the professional way! First add "import logging" at the top of your file, then replace your print with logging.info(). Same output, more control!`,
              code: line.replace(/print\((.*)\)/, 'logging.info($1)'),
              difficulty: "Intermediate"
            },
            {
              title: "🐛 Use logging.debug() for testing",
              description: "Perfect for messages you only want to see during development! You can turn these off in production with one line of code.",
              code: line.replace(/print\((.*)\)/, 'logging.debug($1)'),
              difficulty: "Intermediate"
            }
          ]
        });
      }
      if (line.match(/except:/)) {
        issues.push({
          severity: 'warning',
          message: `Catching all exceptions${varContext}`,
          line: idx + 1,
          type: 'error-handling',
          beginnerExplanation: `⚠️ Heads up! Using just 'except:' is like using a butterfly net to catch everything - even elephants! It catches ALL errors, even unexpected ones${varContext}. This can hide bugs and make finding problems really hard. Think of it like this: if you're trying to catch a "file not found" error, but you accidentally catch a "keyboard interrupt" (when user presses Ctrl+C), your program won't stop when they want it to!`,
          solutions: [
            {
              title: "🎯 Catch specific exception (Best practice!)",
              description: `Replace 'except:' with the specific error you're expecting, like 'except ValueError:' or 'except FileNotFoundError:'. This way you only catch the errors you know how to handle!`,
              code: line.replace(/except:/, 'except ValueError:  # Change ValueError to your expected error'),
              difficulty: "Easy"
            },
            {
              title: "🔧 Catch multiple specific errors",
              description: "If you're expecting a few different errors, you can catch them all with a tuple like this. Much safer than catching everything!",
              code: line.replace(/except:/, 'except (ValueError, TypeError, FileNotFoundError):'),
              difficulty: "Intermediate"
            },
            {
              title: "🛡️ Use Exception with error message",
              description: "If you really need to catch most errors, use 'except Exception as e:' - it's safer than bare except and lets you see what error happened!",
              code: line.replace(/except:/, 'except Exception as e:\n    print(f"Oops, something went wrong: {e}")'),
              difficulty: "Easy"
            }
          ]
        });
      }
      if (line.match(/==\s*None/) || line.match(/None\s*==/)) {
        issues.push({
          severity: 'warning',
          message: `Comparing to None incorrectly${varContext}`,
          line: idx + 1,
          type: 'style',
          beginnerExplanation: `I see you're checking if something equals None${varContext}! 🔍 In Python, there's a better way - use 'is None' instead of '== None'. Why? Think of it like checking if two people are the exact same person (is) vs just looking similar (==). For None, we want to check if it's the EXACT same None object in your computer's memory!`,
          solutions: [
            {
              title: "✨ Use 'is None' (Pythonic way!)",
              description: `Replace '== None' with 'is None'. This is the proper Python style and what experienced programmers expect to see!`,
              code: line.replace(/==\s*None/, 'is None').replace(/None\s*==/, 'is None'),
              difficulty: "Easy"
            },
            {
              title: "🔄 Use 'is not None' for opposite check",
              description: "If you want to check if something is NOT None, use 'is not None' instead of '!= None'",
              code: line.replace(/!=\s*None/, 'is not None').replace(/None\s*!=/, 'is not None'),
              difficulty: "Easy"
            },
            {
              title: "❌ Keep using == (Not recommended)",
              description: "Technically works but not the Python way. Other programmers might think you're new to Python!",
              code: line.trim(),
              difficulty: "Easy"
            }
          ]
        });
      }
    });
  } else if (language === 'c') {
    lines.forEach((line, idx) => {
      const lineVars = extractVariables(line);
      const varContext = lineVars.length > 0 ? ` (variables: ${lineVars.slice(0, 3).join(', ')})` : '';
      
      if (line.includes('gets(')) {
        const bufferVar = line.match(/gets\(([^)]+)\)/)?.[1] || 'your_buffer';
        issues.push({
          severity: 'error',
          message: `DANGER: Using unsafe gets() with ${bufferVar}!`,
          line: idx + 1,
          type: 'security',
          beginnerExplanation: `🚨 STOP! The gets() function you're using with "${bufferVar}" is extremely dangerous! It's like leaving your front door wide open. Here's why: gets() doesn't check how much data you're reading, so if someone types more characters than ${bufferVar} can hold, it will overflow and crash your program - or worse, let hackers take control! This is so dangerous that modern compilers actually warn you about it. Always use fgets() instead - it's like gets() but with a safety lock that prevents overflow.`,
          solutions: [
            {
              title: "✅ Replace with fgets() (Recommended!)",
              description: `Use fgets() which is like gets() but SAFE! It lets you set a maximum size so ${bufferVar} can't overflow. Just make sure ${bufferVar} is a char array with enough space!`,
              code: line.replace(/gets\((.*?)\)/, `fgets($1, sizeof($1), stdin)`),
              difficulty: "Easy"
            },
            {
              title: "🔧 Use scanf with size limit",
              description: `Another safe option! This scanf reads at most 99 characters into ${bufferVar}. Adjust the number based on your buffer size (usually size - 1).`,
              code: line.replace(/gets\((.*?)\)/, `scanf("%99s", $1)  // Adjust 99 to your buffer size - 1`),
              difficulty: "Easy"
            },
            {
              title: "📚 Use getline() for dynamic size",
              description: "Advanced option: getline() automatically allocates memory as needed. Perfect if you don't know how much input to expect!",
              code: `char *${bufferVar} = NULL;\nsize_t bufsize = 0;\ngetline(&${bufferVar}, &bufsize, stdin);`,
              difficulty: "Intermediate"
            }
          ]
        });
      }
      if (line.includes('malloc') && !code.includes('free')) {
        const ptrVar = line.match(/(\w+)\s*=/)?.[1] || 'ptr';
        issues.push({
          severity: 'warning',
          message: `Memory leak: ${ptrVar} allocated but never freed!`,
          line: idx + 1,
          type: 'runtime',
          beginnerExplanation: `📚 Hey! I see you're allocating memory for "${ptrVar}" with malloc()${varContext}, but I don't see a free() call anywhere in your code! Think of malloc() like borrowing a book from the library - you HAVE to return it eventually! If you don't call free(${ptrVar}), your program will keep eating up more and more memory, like hoarding books forever. This is called a "memory leak" and it can slow down or even crash your program over time!`,
          solutions: [
            {
              title: "✅ Add free() call (Required!)",
              description: `When you're done using ${ptrVar}, add free(${ptrVar}); to give the memory back. It's that simple!`,
              code: `${line.trim()}\n// ... use ${ptrVar} for your work ...\nfree(${ptrVar});  // Give the memory back when done!`,
              difficulty: "Easy"
            },
            {
              title: "🛡️ Check malloc success, then free",
              description: `Always check if malloc worked before using ${ptrVar}! Then free it when done. This is the professional way!`,
              code: `${line.trim()}\nif (${ptrVar} == NULL) {\n    printf("Error: Out of memory!\\n");\n    return -1;\n}\n// Use ${ptrVar}\nfree(${ptrVar});`,
              difficulty: "Intermediate"
            },
            {
              title: "🔄 Set to NULL after freeing",
              description: `Best practice: After freeing ${ptrVar}, set it to NULL to prevent accidentally using freed memory (dangling pointer)!`,
              code: `${line.trim()}\n// Use ${ptrVar}\nfree(${ptrVar});\n${ptrVar} = NULL;  // Safety: prevent dangling pointer`,
              difficulty: "Intermediate"
            }
          ]
        });
      }
      if (line.match(/=\s*NULL/) && !line.includes('free')) {
        const ptrVar = line.split('=')[0].trim();
        issues.push({
          severity: 'info',
          message: `Potential memory leak: ${ptrVar} set to NULL without freeing!`,
          line: idx + 1,
          type: 'runtime',
          beginnerExplanation: `⚠️ Wait a second! You're setting "${ptrVar}" to NULL${varContext}, but did you free() the memory it was pointing to first? If ${ptrVar} was pointing to malloc'd memory and you just set it to NULL without freeing it first, that memory is now lost forever in your computer's RAM - like throwing away the only map to buried treasure! This creates a memory leak. Always free() first, THEN set to NULL!`,
          solutions: [
            {
              title: "✅ Free before setting to NULL (Correct way!)",
              description: `Call free(${ptrVar}) first to return the memory, THEN set ${ptrVar} = NULL. This is the right order!`,
              code: `free(${ptrVar});\n${line.trim()}`,
              difficulty: "Easy"
            },
            {
              title: "🔒 Safe pattern: Check, Free, NULL",
              description: `The safest way: Check if ${ptrVar} is not NULL first, free it, then set it to NULL. This prevents errors if it's already NULL!`,
              code: `if (${ptrVar} != NULL) {\n    free(${ptrVar});\n    ${line.trim()}\n}`,
              difficulty: "Intermediate"
            },
            {
              title: "📝 Just set to NULL (Not recommended)",
              description: `You can keep your code as is IF ${ptrVar} never pointed to malloc'd memory. But if it did, this causes a memory leak!`,
              code: line.trim(),
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

function generateFullCorrectedCode(code: string, language: string, issues: Issue[]): string {
  const lines = code.split('\n');
  const correctedLines = [...lines];

  // Apply the first solution for each issue
  issues.forEach(issue => {
    if (issue.solutions && issue.solutions.length > 0) {
      const bestFix = issue.solutions[0].code;
      // Only replace single-line fixes (avoid multi-line replacements conflicting)
      if (!bestFix.includes('\n')) {
        correctedLines[issue.line - 1] = bestFix;
      }
    }
  });

  // Add missing imports for Python
  if (language === 'python') {
    const hasLogging = issues.some(i => i.message.includes('print'));
    if (hasLogging && !code.includes('import logging')) {
      correctedLines.unshift('import logging');
    }
  }

  return correctedLines.join('\n');
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