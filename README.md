### 🧪 X-Debug: The AI-Powered Reverse Debugging PWA 🐞

### LIVE DEMO:- https://debug-divine-spark.lovable.app


### Overview 🌟

**Code-Debugger AI** is an advanced, AI-powered development assistant designed to bridge the gap between static code analysis and human-readable remediation. By integrating deep static analysis with state-of-the-art LLM reasoning, this tool transforms complex syntax, runtime, and logic errors into a simplified, step-by-step debugging experience for Python and C developers. 💡

### Problem 🚩

Modern software development often leads to "blind" debugging, where developers spend hours chasing "Heisenbugs," silent memory leaks, or logical flaws that traditional compilers ignore. Manually tracing stack corruption, mutable default arguments, or complex off-by-one errors is mentally taxing and hinders productivity, especially in C where memory management is unforgiving and Python where logical scope issues can lead to unpredictable runtime behavior. 📉

### Solution 🚀

This project implements a sophisticated 3-layer AI pipeline to automate the identification and resolution of technical debt. Key highlights include:

* 🔹 **Layer 1 (Expert System):** Rule-based static analysis engine that preemptively flags syntax anomalies, null pointers, and insecure coding patterns. 🎯
* 🔹 **Layer 2 (ML Analysis):** **CodeBERT-based defect probability scoring** that evaluates the "riskiness" of code snippets before execution. 🧠
* 🔹 **Layer 3 (NLP Explanation):** **LangChain-powered narratives** that provide developers with human-centric explanations for *why* their code is failing. ⚡
* 🔹 **Git-Branch Simulator:** A safe, non-destructive **"Safe Sandbox"** that allows users to preview AI fixes via a dual-pane Diff Viewer before committing changes to their codebase. 💾

### Tech Stack 🛠️

* ⚛️ **Frontend:** React, TypeScript, Vite, and Tailwind CSS (Claymorphism UI).
* 🐍 **Backend:** Supabase (Auth, Storage, Edge Functions).
* 🧠 **AI Engine:** Google Gemini (Generative AI) & CodeBERT (Defect Scoring).
* ⚙️ **Architecture:** Context API for "Live" vs. "Proposed" code state management.

### System Architecture 🏗️

The application follows a modular structure optimized for production-ready PWA performance:

```
[UI/UX Layer (React)] ──(Code Input/Diff Preview)──> [SandboxProvider (Context API)]
│
(API Contract: JSON)
▼
[AI Analysis Pipeline (Edge Functions)] <──> [CodeBERT/Gemini Reasoning]

```

### Analytical Capabilities 🧠

When code is submitted, the AI engine grounds its analysis to formulate:

* 📊 **Defect Probability Scoring:** High-precision risk assessment based on structural patterns.
* 🔍 **Causal Graph Visualization:** Dynamic rendering of cause-effect relationships between variables, functions, and control structures.
* 🛡️ **Multi-Fix Ranking Engine:** Generates multiple alternative solutions, ranked by confidence and efficiency, including "When this may not work" caveats.

### How to Run Locally 💻

1. **Prerequisites:** Node.js, Python 3.11+, and Supabase CLI.
2. **Setup Workspace:**

```bash
git clone https://github.com/AaineeSinha/X-Debug.git
cd X-Debug
npm install

```

3. **Configure Secrets:**
Create a `.env` file and add your Supabase and AI provider credentials.
4. **Execution:**

```bash
npm run dev

```

## 🔍 Debugging Scenarios & Test Cases

| # | Language | Issue Type | Test Logic |
| --- | --- | --- | --- |
| 1 | **Python** | Logic | Mutable Default Arguments (e.g., `def func(log=[])`) |
| 2 | **C** | Memory | Buffer overflow via `strcpy` without bounds checking |
| 3 | **C** | Logic | Uninitialized variables containing "garbage" memory |
| 4 | **Python** | Scope | Late binding in lambda closures (e.g., `lambda: i`) |

---

### 🚀 Quick Testing Snippet

Paste this into the editor to trigger the AI-powered Causal Graph:

```c
// Test Case: Uninitialized Variable Bug
int main() {
    int score; // Garbage memory
    int total = score + 10;
    return 0;
}

```

### Future Scope 🔮

* 🚀 **Multi-Language Expansion:** Extend static analysis to Rust and Go.
* 📁 **Direct IDE Integration:** VS Code extension to bring the "Safe Sandbox" directly into your local workflow.
* 📊 **History Analytics:** A local database archive to track code improvement metrics over time.

Happy Debugging! 🛡️✨ Keep your code clean and your logic sound. 🥂
