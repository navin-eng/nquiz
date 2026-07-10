"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Plus, FileJson, FileSpreadsheet, X, Info, Shuffle } from "lucide-react";
import toast from "react-hot-toast";

type QuestionPayload = {
  text: string;
  explanation: string;
  options: string[];
  correctOptionIndex: number;
};

type ImportedQuestion = {
  text?: string;
  question?: string;
  explanation?: string;
  options?: unknown;
  correctOptionIndex?: string | number;
};

type CsvRow = Record<string, string | undefined> & {
  text?: string;
  question?: string;
  explanation?: string;
  correctOptionIndex?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
};

type PreviewField = "text" | "explanation" | "correctOptionIndex" | "options";

function normalizeImportedQuestion(q: ImportedQuestion): QuestionPayload {
  return {
    text: q.text || q.question || "",
    explanation: q.explanation || "",
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correctOptionIndex: parseInt(String(q.correctOptionIndex ?? 0)) || 0,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function QuestionUpload({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "json" | "csv">("manual");
  const [loading, setLoading] = useState(false);

  // Paste State
  const [pasteContent, setPasteContent] = useState("");

  // Preview State
  const [previewQuestions, setPreviewQuestions] = useState<QuestionPayload[] | null>(null);

  // Manual State
  const [text, setText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const uploadQuestions = async (questions: QuestionPayload[]) => {
    setLoading(true);
    const toastId = toast.loading("Saving questions...");
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, questions }),
      });
      if (res.ok) {
        toast.success("Questions added successfully!", { id: toastId });
        setText("");
        setExplanation("");
        setOptions(["", ""]);
        setCorrectIndex(0);
        setPasteContent("");
        setPreviewQuestions(null);
        router.refresh();
      } else {
        let errorMessage = "Upload failed";
        try {
          const data = await res.json();
          errorMessage = data.message || errorMessage;
        } catch {
          errorMessage = await res.text() || errorMessage;
        }
        toast.error(errorMessage, { id: toastId });
      }
    } catch (err) {
      toast.error("An unexpected error occurred: " + (err as Error).message, { id: toastId });
    }
    setLoading(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || options.some((o) => !o)) {
      toast.error("Please fill the question text and all option fields.");
      return;
    }
    uploadQuestions([{ text, explanation, options, correctOptionIndex: correctIndex }]);
  };

  const handlePastePreview = () => {
    if (!pasteContent.trim()) {
      toast.error("Please paste some JSON first.");
      return;
    }
    try {
      const json = JSON.parse(pasteContent);
      if (Array.isArray(json)) {
        const formatted = (json as ImportedQuestion[]).map(normalizeImportedQuestion);
        setPreviewQuestions(formatted);
      } else {
        toast.error("JSON must be an array of questions.");
      }
    } catch {
      toast.error("Invalid JSON format. Please ensure it is a valid JSON array.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === "json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            const formatted = (json as ImportedQuestion[]).map(normalizeImportedQuestion);
            setPreviewQuestions(formatted);
          } else {
            toast.error("JSON must be an array of questions");
          }
        } catch {
          toast.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    } else if (mode === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<CsvRow>) => {
          const parsed: QuestionPayload[] = results.data.filter((r) => r.text || r.question).map((r) => {
            const rowKeys = Object.keys(r);
            const optKeys = rowKeys.filter(k => k.toLowerCase().startsWith('option'));
            const rowOpts = optKeys.map(k => r[k]).filter((opt): opt is string => Boolean(opt));

            return {
              text: r.text || r.question || "",
              explanation: r.explanation || "",
              options: rowOpts.length >= 2 ? rowOpts : [r.option1, r.option2, r.option3, r.option4].filter((opt): opt is string => Boolean(opt)),
              correctOptionIndex: parseInt(r.correctOptionIndex || "0") || 0
            };
          });
          if (parsed.length > 0) {
            setPreviewQuestions(parsed);
          } else {
            toast.error("Invalid CSV format or empty file");
          }
        },
        error: () => toast.error("Failed to parse CSV")
      });
    }
  };

  const updatePreviewQuestion = (qIndex: number, field: PreviewField, value: string | number, optIndex?: number) => {
    if (!previewQuestions) return;
    const newQs = [...previewQuestions];
    if (field === "text") {
      newQs[qIndex].text = String(value);
    } else if (field === "explanation") {
      newQs[qIndex].explanation = String(value);
    } else if (field === "correctOptionIndex") {
      newQs[qIndex].correctOptionIndex = Number(value);
    } else if (field === "options" && optIndex !== undefined) {
      newQs[qIndex].options[optIndex] = String(value);
    }
    setPreviewQuestions(newQs);
  };

  const addPreviewOption = (qIndex: number) => {
    if (!previewQuestions) return;
    const newQs = [...previewQuestions];
    newQs[qIndex].options.push("");
    setPreviewQuestions(newQs);
  };

  const removePreviewOption = (qIndex: number, optIndex: number) => {
    if (!previewQuestions) return;
    const newQs = [...previewQuestions];
    if (newQs[qIndex].options.length <= 2) {
      toast.error("A question must have at least 2 options.");
      return;
    }
    newQs[qIndex].options.splice(optIndex, 1);
    if (newQs[qIndex].correctOptionIndex >= newQs[qIndex].options.length) {
      newQs[qIndex].correctOptionIndex = Math.max(0, newQs[qIndex].options.length - 1);
    }
    setPreviewQuestions(newQs);
  };

  const shufflePreviewOption = (qIndex: number) => {
    if (!previewQuestions) return;
    const newQs = [...previewQuestions];
    const q = newQs[qIndex];
    const optsWithFlags = q.options.map((opt, idx) => ({ opt, isCorrect: idx === q.correctOptionIndex }));
    const shuffled = shuffleArray(optsWithFlags);
    q.options = shuffled.map(o => o.opt);
    q.correctOptionIndex = shuffled.findIndex(o => o.isCorrect);
    setPreviewQuestions(newQs);
  };

  return (
    <div className="glass-panel glass-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="heading-2 !mb-0">Add Questions</h2>
        
        {!previewQuestions && (
          <div className="segmented-control">
            <button 
              onClick={() => setMode("manual")} 
              className={`segment-item text-sm ${mode === "manual" ? "is-active" : ""}`}
            >
              Manual
            </button>
            <button 
              onClick={() => setMode("json")} 
              className={`segment-item text-sm ${mode === "json" ? "is-active" : ""}`}
            >
              JSON
            </button>
            <button 
              onClick={() => setMode("csv")} 
              className={`segment-item text-sm ${mode === "csv" ? "is-active" : ""}`}
            >
              CSV
            </button>
          </div>
        )}
      </div>

      {previewQuestions ? (
        <div className="flex flex-col gap-6">
          <div className="stat-card flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-primary/10 border-primary/30">
            <div>
              <h3 className="font-bold text-lg text-primary">Previewing {previewQuestions.length} Questions</h3>
              <p className="text-sm text-gray-400">You can edit the questions below before saving.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button 
                onClick={() => {
                  if (!previewQuestions) return;
                  const newQs = previewQuestions.map(q => {
                    const optsWithFlags = q.options.map((opt, idx) => ({ opt, isCorrect: idx === q.correctOptionIndex }));
                    const shuffled = shuffleArray(optsWithFlags);
                    return {
                      ...q,
                      options: shuffled.map(o => o.opt),
                      correctOptionIndex: shuffled.findIndex(o => o.isCorrect)
                    };
                  });
                  setPreviewQuestions(newQs);
                  toast.success("All options shuffled!");
                }}
                className="btn btn-secondary text-sm py-2"
              >
                <Shuffle size={16} /> Shuffle All Options
              </button>
              <button onClick={() => setPreviewQuestions(null)} className="btn btn-secondary text-sm py-2">
                Cancel
              </button>
              <button onClick={() => uploadQuestions(previewQuestions)} disabled={loading} className="btn btn-primary text-sm py-2">
                {loading ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2">
            {previewQuestions.map((q, qIndex) => (
              <div key={qIndex} className="bg-black/20 border border-white/5 rounded-xl p-5 flex flex-col gap-4 relative group transition-colors hover:border-white/10">
                <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold shadow-lg shadow-primary/20">
                  {qIndex + 1}
                </div>
                
                <div className="pl-4 border-l-2 border-primary/30">
                  <input 
                    className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none transition-colors text-lg font-semibold py-1 px-2 -ml-2"
                    value={q.text || ""}
                    onChange={(e) => updatePreviewQuestion(qIndex, "text", e.target.value)}
                    placeholder="Question Text"
                  />
                  
                  <div className="flex items-start gap-2 mt-2">
                    <Info size={14} className="text-gray-500 mt-1.5 shrink-0" />
                    <textarea 
                      className="w-full bg-transparent border border-transparent hover:border-white/20 focus:border-white/20 focus:bg-white/5 rounded-lg focus:outline-none transition-all text-sm text-gray-300 py-1 px-2 -ml-2 resize-none min-h-[28px]"
                      value={q.explanation || ""}
                      onChange={(e) => updatePreviewQuestion(qIndex, "explanation", e.target.value)}
                      placeholder="Add an optional explanation here..."
                      rows={q.explanation ? 2 : 1}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options?.map((opt: string, optIndex: number) => (
                      <div key={optIndex} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${q.correctOptionIndex === optIndex ? 'bg-success/10 border-success/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`}
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() => updatePreviewQuestion(qIndex, "correctOptionIndex", optIndex)}
                          className="w-4 h-4 accent-success shrink-0 cursor-pointer"
                          title="Mark as correct answer"
                        />
                        <input 
                          className="w-full bg-transparent border-none focus:outline-none text-sm"
                          value={opt || ""}
                          onChange={(e) => updatePreviewQuestion(qIndex, "options", e.target.value, optIndex)}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <button 
                          onClick={() => removePreviewOption(qIndex, optIndex)}
                          className="text-gray-500 hover:text-danger p-1 rounded-md hover:bg-danger/10 transition-colors"
                          title="Remove option"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 px-1">
                    <button onClick={() => addPreviewOption(qIndex)} className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                      <Plus size={12} /> Add Option
                    </button>
                    <button 
                      onClick={() => shufflePreviewOption(qIndex)} 
                      className="text-gray-400 text-xs font-medium hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Shuffle size={12} /> Shuffle Options
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : mode === "manual" ? (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Question Text</label>
            <input 
              type="text" 
              className="input-field" 
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What is the capital of France?"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <Info size={14} /> Explanation (Optional)
            </label>
            <textarea 
              className="input-field min-h-[60px] resize-y" 
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Provide a detailed explanation for the correct answer..."
            />
          </div>
          
          <div>
            <label className="input-label mb-3 block">Options (Select the correct answer)</label>
            <div className="flex flex-col gap-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="correctOption" 
                    checked={correctIndex === idx}
                    onChange={() => setCorrectIndex(idx)}
                    className="w-4 h-4 accent-success shrink-0 cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    value={opt}
                    onChange={e => {
                      const newOpts = [...options];
                      newOpts[idx] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (options.length <= 2) {
                        toast.error("A question must have at least 2 options.");
                        return;
                      }
                      const newOpts = [...options];
                      newOpts.splice(idx, 1);
                      setOptions(newOpts);
                      if (correctIndex >= newOpts.length) setCorrectIndex(Math.max(0, newOpts.length - 1));
                    }}
                    className="icon-btn"
                    title="Remove option"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3">
              <button 
                type="button" 
                onClick={() => setOptions([...options, ""])} 
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Option
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const optsWithFlags = options.map((opt, idx) => ({ opt, isCorrect: idx === correctIndex }));
                  const shuffled = shuffleArray(optsWithFlags);
                  setOptions(shuffled.map(o => o.opt));
                  setCorrectIndex(shuffled.findIndex(o => o.isCorrect));
                }} 
                className="text-gray-400 text-sm font-medium hover:text-white transition-colors flex items-center gap-1"
              >
                <Shuffle size={14} /> Shuffle
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary mt-6 self-end">
            <Plus size={18} />
            {loading ? "Adding..." : "Add Question"}
          </button>
        </form>
      ) : mode === "json" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="stat-card flex flex-col gap-4">
            <label className="input-label font-bold text-base">Paste JSON Array</label>
            <textarea 
              className="input-field min-h-[250px] resize-y font-mono text-sm"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder={'[\n  {\n    "text": "Sample Question?",\n    "explanation": "Because...",\n    "options": ["A", "B", "C"],\n    "correctOptionIndex": 0\n  }\n]'}
            />
            <button onClick={handlePastePreview} className="btn btn-primary self-end w-full justify-center mt-2">
              Preview JSON
            </button>
          </div>

          <div className="stat-card border-2 border-dashed border-white/20 text-center hover:bg-white/5 transition-colors cursor-pointer relative flex flex-col justify-center min-h-[300px]">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              <FileJson size={48} className="text-primary" />
              <h3 className="text-lg font-semibold">
                {loading ? "Processing..." : `Upload JSON File`}
              </h3>
              <p className="text-gray-400 text-sm">
                Click or drag file here to import and preview questions.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="stat-card border-2 border-dashed border-white/20 text-center hover:bg-white/5 transition-colors cursor-pointer relative min-h-[250px] flex flex-col justify-center">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <FileSpreadsheet size={48} className="text-primary" />
            <h3 className="text-lg font-semibold">
              {loading ? "Processing..." : `Upload CSV File`}
            </h3>
            <p className="text-gray-400 text-sm">
              Columns: text, explanation, option1, option2..., correctOptionIndex
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
