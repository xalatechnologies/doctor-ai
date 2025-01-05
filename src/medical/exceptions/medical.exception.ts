import { HttpException, HttpStatus } from '@nestjs/common';

export class MedicalException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly details?: any
  ) {
    super(
      {
        status: 'error',
        message,
        details,
      },
      status
    );
  }
}

export class InvalidSymptomDataException extends MedicalException {
  constructor(details?: any) {
    super(
      'Invalid symptom data provided',
      HttpStatus.BAD_REQUEST,
      details
    );
  }
}

export class EmergencyAssessmentException extends MedicalException {
  constructor(details?: any) {
    super(
      'Failed to assess emergency level',
      HttpStatus.INTERNAL_SERVER_ERROR,
      details
    );
  }
} 