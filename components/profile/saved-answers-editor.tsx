'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  listSavedAnswers,
  removeSavedAnswer,
  setSavedAnswer,
  savedAnswerSchema,
} from '@/lib/services/profile/saved-answers';

interface SavedAnswersEditorProps {
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
}

const inputClass =
  'w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

export function SavedAnswersEditor({ answers, onChange }: SavedAnswersEditorProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const items = listSavedAnswers(answers);

  const handleAdd = () => {
    const parsed = savedAnswerSchema.safeParse({ question, answer });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'A question and answer are required.');
      return;
    }
    onChange(setSavedAnswer(answers, parsed.data));
    setQuestion('');
    setAnswer('');
    setError(null);
  };

  const handleAnswerChange = (item: string, value: string) => {
    onChange({ ...answers, [item]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Save answers to questions that repeat across applications, such as salary
        expectations or notice period. They are stored with your profile and reused
        later.
      </p>

      <div className="space-y-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question (e.g. Expected salary)"
          className={inputClass}
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
          rows={2}
          className={`${inputClass} resize-none`}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <Button onClick={handleAdd} className="w-full">
          Add Saved Answer
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">No saved answers yet</p>
        )}
        {items.map((item) => (
          <Card key={item.question} className="bg-white/5">
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="w-full min-w-0 space-y-2">
                <p className="text-sm font-medium">{item.question}</p>
                <textarea
                  value={item.answer}
                  onChange={(e) => handleAnswerChange(item.question, e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none text-sm`}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(removeSavedAnswer(answers, item.question))}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
