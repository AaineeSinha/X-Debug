import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  errors?: Array<{ line: number; message: string; severity: string }>;
}

export function CodeEditor({ value, onChange, language, errors = [] }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && errors.length > 0) {
      // Highlight error lines
      const lines = value.split('\n');
      const errorLines = errors.map(e => e.line - 1);
      
      // You could enhance this with line-specific highlighting
      // For now, we'll use a simpler approach with CSS classes
    }
  }, [errors, value]);

  const getLineNumbers = () => {
    const lines = value.split('\n');
    return lines.map((_, idx) => {
      const hasError = errors.some(e => e.line === idx + 1);
      return (
        <div
          key={idx}
          className={`text-right pr-2 select-none ${
            hasError ? 'text-destructive font-bold' : 'text-muted-foreground'
          }`}
        >
          {idx + 1}
        </div>
      );
    });
  };

  return (
    <div className="relative">
      <div className="flex gap-2 border rounded-md bg-input/50 overflow-hidden">
        <div className="py-3 pl-3 bg-muted/30 text-sm font-mono">
          {getLineNumbers()}
        </div>
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Paste your ${language === "python" ? "Python" : "C"} code here...`}
            className="font-mono min-h-[400px] border-0 bg-transparent resize-none focus-visible:ring-0"
            spellCheck={false}
          />
          
          {/* Error tooltips */}
          {errors.map((error, idx) => (
            <div
              key={idx}
              className="absolute left-0 right-0 px-3 py-1 bg-destructive/10 border-l-4 border-destructive text-xs"
              style={{
                top: `${(error.line - 1) * 24}px`,
                pointerEvents: 'none',
              }}
            >
              <span className="text-destructive font-medium">
                Line {error.line}: {error.message}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {errors.length > 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          {errors.length} error{errors.length !== 1 ? 's' : ''} detected
        </div>
      )}
    </div>
  );
}