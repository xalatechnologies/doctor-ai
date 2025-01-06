import { HttpException, HttpStatus } from '@nestjs/common';

export class EmergencyAssessmentException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class InvalidEmergencyDataException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
} 