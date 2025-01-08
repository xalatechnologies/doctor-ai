import { render, fireEvent, screen } from '@testing-library/react';
import { FollowUpQuestions } from './follow-up-questions.component';
import { QuestionnaireDto, QuestionPriority } from '@dto/questionnaire.dto';

describe('FollowUpQuestions', () => {
  const mockQuestionnaire: QuestionnaireDto = {
    questions: [
      {
        text: 'How long have you had this symptom?',
        type: 'text'
      },
      {
        text: 'Rate your pain level',
        type: 'select',
        options: ['Mild', 'Moderate', 'Severe']
      }
    ],
    followUpQuestions: [
      {
        text: 'Have you taken any medication?',
        type: 'boolean'
      }
    ],
    priority: QuestionPriority.MEDIUM
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all questions', () => {
    render(
      <FollowUpQuestions
        questionnaire={mockQuestionnaire}
        onSubmit={mockOnSubmit}
      />
    );

    mockQuestionnaire.questions.forEach(question => {
      expect(screen.getByText(question.text)).toBeInTheDocument();
    });
  });

  it('should handle text input changes', () => {
    render(
      <FollowUpQuestions
        questionnaire={mockQuestionnaire}
        onSubmit={mockOnSubmit}
      />
    );

    const textInput = screen.getByLabelText(/how long/i);
    fireEvent.change(textInput, { target: { value: '2 days' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: expect.arrayContaining([
          expect.objectContaining({
            question: mockQuestionnaire.questions[0].text,
            answer: '2 days'
          })
        ])
      })
    );
  });

  it('should handle select option changes', async () => {
    render(
      <FollowUpQuestions
        questionnaire={mockQuestionnaire}
        onSubmit={mockOnSubmit}
      />
    );

    const select = screen.getByLabelText(/pain level/i);
    fireEvent.change(select, { target: { value: 'Severe' } });

    const textInput = screen.getByLabelText(/how long/i);
    fireEvent.change(textInput, { target: { value: '2 days' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: expect.arrayContaining([
          expect.objectContaining({
            question: mockQuestionnaire.questions[1].text,
            answer: 'Severe'
          })
        ])
      })
    );
  });

  it('should validate required fields before submission', () => {
    render(
      <FollowUpQuestions
        questionnaire={mockQuestionnaire}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/please answer all required questions/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 