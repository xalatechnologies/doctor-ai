import React, { useState } from 'react';
import { QuestionnaireDto } from '@dto/questionnaire.dto';

interface FollowUpQuestionsProps {
  questionnaire: QuestionnaireDto;
  onSubmit: (data: { answers: Array<{ question: string; answer: string }> }) => void;
}

export const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({ questionnaire, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleChange = (question: string, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredQuestions = questionnaire.questions.filter(q => !q.type || q.type === 'text');
    const missingAnswers = requiredQuestions.some(q => !answers[q.text]);

    if (missingAnswers) {
      setError('Please answer all required questions');
      return;
    }

    const formattedAnswers = questionnaire.questions
      .filter(q => answers[q.text])
      .map(q => ({
        question: q.text,
        answer: answers[q.text]
      }));

    onSubmit({
      answers: formattedAnswers
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert">{error}</div>}

      {questionnaire.questions.map((question, index) => (
        <div key={index}>
          <label htmlFor={`question-${index}`}>{question.text}</label>
          {question.type === 'select' ? (
            <select
              id={`question-${index}`}
              value={answers[question.text] || ''}
              onChange={e => handleChange(question.text, e.target.value)}
              aria-label={question.text.toLowerCase()}
            >
              <option value="">Select an option</option>
              {question.options?.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : question.type === 'boolean' ? (
            <div>
              <input
                type="radio"
                id={`question-${index}-yes`}
                name={`question-${index}`}
                value="yes"
                onChange={e => handleChange(question.text, e.target.value)}
                checked={answers[question.text] === 'yes'}
              />
              <label htmlFor={`question-${index}-yes`}>Yes</label>

              <input
                type="radio"
                id={`question-${index}-no`}
                name={`question-${index}`}
                value="no"
                onChange={e => handleChange(question.text, e.target.value)}
                checked={answers[question.text] === 'no'}
              />
              <label htmlFor={`question-${index}-no`}>No</label>
            </div>
          ) : (
            <input
              id={`question-${index}`}
              type="text"
              value={answers[question.text] || ''}
              onChange={e => handleChange(question.text, e.target.value)}
              aria-label={question.text.toLowerCase()}
            />
          )}
        </div>
      ))}

      <button type="submit">Submit</button>
    </form>
  );
}; 