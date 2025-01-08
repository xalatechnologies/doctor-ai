import { render, fireEvent, screen } from '@testing-library/react';
import { SymptomInput } from './symptom-input.component';

describe('SymptomInput', () => {
  const mockOnSubmit = jest.fn();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all input fields', () => {
    render(
      <SymptomInput
        onSubmit={mockOnSubmit}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText(/primary symptom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it('should call onSubmit with form data when submitted', async () => {
    render(
      <SymptomInput
        onSubmit={mockOnSubmit}
        onChange={mockOnChange}
      />
    );

    const primarySymptomInput = screen.getByLabelText(/primary symptom/i);
    const severityInput = screen.getByLabelText(/severity/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(primarySymptomInput, { target: { value: 'headache' } });
    fireEvent.change(severityInput, { target: { value: '7' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        primarySymptom: 'headache',
        severityLevel: '7'
      })
    );
  });

  it('should validate required fields', async () => {
    render(
      <SymptomInput
        onSubmit={mockOnSubmit}
        onChange={mockOnChange}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/primary symptom is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onChange when input values change', () => {
    render(
      <SymptomInput
        onSubmit={mockOnSubmit}
        onChange={mockOnChange}
      />
    );

    const primarySymptomInput = screen.getByLabelText(/primary symptom/i);
    fireEvent.change(primarySymptomInput, { target: { value: 'headache' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        primarySymptom: 'headache'
      })
    );
  });
}); 