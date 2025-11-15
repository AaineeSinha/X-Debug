import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { format, data } = await req.json();
    
    console.log('Exporting report:', { format });

    if (format === 'txt') {
      const txtContent = generateTxtReport(data);
      return new Response(txtContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="debug-report-${Date.now()}.txt"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF, we'll return a simple text format
      // In production, use a PDF generation library
      const pdfContent = generateTxtReport(data);
      return new Response(pdfContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="debug-report-${Date.now()}.pdf"`,
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in export-report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateTxtReport(data: any) {
  let report = '='.repeat(60) + '\n';
  report += '          X-DEBUG ANALYSIS REPORT\n';
  report += '='.repeat(60) + '\n\n';
  
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Language: ${data.language}\n`;
  report += `Filename: ${data.filename}\n`;
  report += `AI Defect Score: ${(data.aiScore * 100).toFixed(0)}%\n\n`;
  
  report += '-'.repeat(60) + '\n';
  report += 'CODE:\n';
  report += '-'.repeat(60) + '\n';
  report += data.code + '\n\n';
  
  report += '-'.repeat(60) + '\n';
  report += 'ROOT CAUSE ANALYSIS:\n';
  report += '-'.repeat(60) + '\n';
  report += data.rootCause + '\n\n';
  
  report += '-'.repeat(60) + '\n';
  report += 'STATIC ANALYSIS ISSUES:\n';
  report += '-'.repeat(60) + '\n';
  
  if (data.staticIssues && data.staticIssues.length > 0) {
    data.staticIssues.forEach((issue: any, idx: number) => {
      report += `${idx + 1}. [${issue.severity.toUpperCase()}] Line ${issue.line}\n`;
      report += `   ${issue.message}\n\n`;
    });
  } else {
    report += 'No issues detected.\n\n';
  }
  
  report += '-'.repeat(60) + '\n';
  report += 'AI SUGGESTIONS:\n';
  report += '-'.repeat(60) + '\n';
  
  if (data.suggestions && data.suggestions.length > 0) {
    data.suggestions.forEach((suggestion: any, idx: number) => {
      report += `${idx + 1}. ${suggestion.title || suggestion}\n`;
      if (suggestion.description) {
        report += `   ${suggestion.description}\n`;
      }
      report += '\n';
    });
  }
  
  if (data.alternativeFixes && data.alternativeFixes.length > 0) {
    report += '\n' + '-'.repeat(60) + '\n';
    report += 'SUGGESTED FIXES:\n';
    report += '-'.repeat(60) + '\n';
    
    data.alternativeFixes.forEach((fix: any) => {
      report += `Line ${fix.line}:\n`;
      report += `  Original: ${fix.original}\n`;
      fix.alternatives.forEach((alt: any, idx: number) => {
        report += `  Fix ${idx + 1} (${(alt.confidence * 100).toFixed(0)}% confidence):\n`;
        report += `    ${alt.fix}\n`;
        report += `    Reason: ${alt.explanation}\n`;
      });
      report += '\n';
    });
  }
  
  report += '='.repeat(60) + '\n';
  report += 'END OF REPORT\n';
  report += '='.repeat(60) + '\n';
  
  return report;
}