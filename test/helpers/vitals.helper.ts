import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export const submitVitals = async (app: INestApplication, patientId: string, vitals: any) => {
  return request(app.getHttpServer())
    .post(`/monitoring/${patientId}/vitals`)
    .send(vitals);
}; 