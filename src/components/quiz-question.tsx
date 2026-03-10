import { QuizQuestion as QuizQuestionType } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface QuizQuestionProps {
  question: QuizQuestionType;
  value?: string;
  onChange: (optionId: string) => void;
}

export function QuizQuestion({ question, value, onChange }: QuizQuestionProps) {
  return (
    <Card>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-100">{question.prompt}</legend>
        {question.options.map((option) => (
          <label
            key={option.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
              value === option.id
                ? "border-zinc-400 bg-zinc-900 text-zinc-100"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500",
            )}
          >
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="h-4 w-4 accent-zinc-300"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </Card>
  );
}
