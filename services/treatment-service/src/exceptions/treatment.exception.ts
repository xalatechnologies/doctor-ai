import { HttpException, HttpStatus } from '@nestjs/common';

export class TreatmentNotFoundException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class InvalidTreatmentDataException extends HttpException {
  constructor(message: string = 'Invalid treatment data provided') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class TreatmentPublishingException extends HttpException {
  constructor(message: string = 'Failed to publish treatment data') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 