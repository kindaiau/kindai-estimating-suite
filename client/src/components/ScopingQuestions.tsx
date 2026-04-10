import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ClipboardList, HelpCircle, CheckCircle2 } from "lucide-react";
import { getScopingQuestions, type ScopingQuestion } from "../../../shared/scopingQuestions";

type ScopingAnswers = Record<string, string | string[] | number>;

interface ScopingQuestionsProps {
  tradeId: string;
  onChange: (answers: ScopingAnswers) => void;
  className?: string;
}

export default function ScopingQuestionsPanel({ tradeId, onChange, className }: ScopingQuestionsProps) {
  const questions = useMemo(() => getScopingQuestions(tradeId), [tradeId]);
  const [answers, setAnswers] = useState<ScopingAnswers>({});

  // Reset answers when trade changes
  useEffect(() => {
    setAnswers({});
    onChange({});
  }, [tradeId]);

  const updateAnswer = (id: string, value: string | string[] | number) => {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    onChange(next);
  };

  const answeredCount = questions.filter(q => {
    const v = answers[q.id];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  const requiredCount = questions.filter(q => q.required).length;
  const requiredAnswered = questions.filter(q => {
    if (!q.required) return false;
    const v = answers[q.id];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  if (!tradeId || questions.length === 0) return null;

  return (
    <Card className={`border-0 shadow-md rounded-2xl overflow-hidden ${className ?? ""}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-black flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <ClipboardList className="w-3.5 h-3.5 text-white" />
          </span>
          Scope the Job
          <Badge variant="outline" className="ml-auto text-[10px] font-bold">
            {answeredCount}/{questions.length} answered
          </Badge>
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Answer these quick questions so the AI knows exactly what to price. More detail = more accurate estimate.
        </p>
        {requiredCount > 0 && requiredAnswered < requiredCount && (
          <p className="text-[10px] text-orange-500 font-semibold mt-1">
            {requiredCount - requiredAnswered} required question{requiredCount - requiredAnswered > 1 ? "s" : ""} remaining
          </p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {questions.map((q) => (
          <ScopingField
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(val) => updateAnswer(q.id, val)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ScopingField({
  question,
  value,
  onChange,
}: {
  question: ScopingQuestion;
  value: string | string[] | number | undefined;
  onChange: (val: string | string[] | number) => void;
}) {
  const hasValue = value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-bold text-gray-700">
          {question.label}
          {question.required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        {hasValue && <CheckCircle2 className="w-3 h-3 text-green-500" />}
      </div>

      {question.helpText && (
        <p className="text-[10px] text-gray-400 flex items-start gap-1">
          <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {question.helpText}
        </p>
      )}

      {question.type === "select" && question.options && (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className="rounded-xl border-gray-200 text-sm h-9">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === "multiselect" && question.options && (
        <MultiSelectField
          options={question.options}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      )}

      {question.type === "number" && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={question.placeholder}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            className="rounded-xl border-gray-200 text-sm h-9"
          />
          {question.unit && (
            <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{question.unit}</span>
          )}
        </div>
      )}

      {question.type === "text" && (
        <Textarea
          placeholder={question.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl border-gray-200 text-sm min-h-[60px]"
        />
      )}
    </div>
  );
}

function MultiSelectField({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selected
                ? "bg-violet-100 border-violet-300 text-violet-700"
                : "bg-white border-gray-200 text-gray-500 hover:border-violet-200 hover:bg-violet-50"
            }`}
          >
            {selected && "✓ "}{opt}
          </button>
        );
      })}
    </div>
  );
}
