import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { GetSymptomSuggestionsDto } from '@dto/get-symptom-suggestions.dto';
import { AdaptiveQuestionnaireInput } from '@dto/adaptive-questionnaire.dto';
import { SymptomTimelineInput } from '@dto/symptom-timeline.dto';
import { SymptomAnalysisInput } from '@dto/symptom-analysis-input.dto';
import { SymptomAnalysis } from '@interfaces/symptom.interface';
import { SymptomSuggestionResponse } from '@interfaces/symptom-suggestion.interface';
import { AdaptiveQuestionnaireResponse } from '@interfaces/adaptive-questionnaire.interface';
import { SymptomTimelineResponse } from '@interfaces/symptom-timeline.interface';
import { SymptomHistoryResponse } from '@interfaces/symptom-history.interface';
import { MultiLLMAnalysisResponse } from '@interfaces/multi-llm-analysis.interface';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Symptom Analysis')
@Controller('symptom-analysis')
export class SymptomAnalysisController {
  private readonly logger = new Logger(SymptomAnalysisController.name);

  constructor(private readonly symptomAnalysisService: SymptomAnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Analyze symptoms and provide recommendations' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The symptom analysis has been successfully created',
    type: SymptomAnalysis,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async analyzeSymptomHttp(@Body() analyzeSymptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    this.logger.log(`Received HTTP request to analyze symptoms: ${analyzeSymptomDto.description}`);
    return this.symptomAnalysisService.analyzeSymptom(analyzeSymptomDto);
  }

  @MessagePattern({ cmd: 'analyze_symptom' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async analyzeSymptom(@Payload() analyzeSymptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    this.logger.log(`Received message to analyze symptoms: ${analyzeSymptomDto.description}`);
    return this.symptomAnalysisService.analyzeSymptom(analyzeSymptomDto);
  }

  @MessagePattern({ cmd: 'emergency.assessed' })
  async handleEmergencyAssessment(
    @Payload() data: {
      assessment: {
        category: string;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        immediateActions: string[];
      };
      patientData: {
        medications?: string[];
      };
    },
  ): Promise<void> {
    this.logger.log(`Received emergency assessment for category: ${data.assessment.category}`);
    return this.symptomAnalysisService.handleEmergencyAssessment(data);
  }

  @MessagePattern({ cmd: 'symptom.status' })
  async getSymptomAnalysisStatus(): Promise<{ status: string; timestamp: string }> {
    this.logger.debug('Checking symptom analysis service status');
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('symptom-suggestions')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Get real-time symptom suggestions based on input text' })
  @ApiQuery({
    name: 'query',
    type: String,
    description: 'Text to get symptom suggestions for',
    required: true,
    example: 'head'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of symptom suggestions',
    type: SymptomSuggestionResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input query'
  })
  async getSymptomSuggestions(@Query() query: GetSymptomSuggestionsDto): Promise<SymptomSuggestionResponse> {
    this.logger.log(`Received request for symptom suggestions with query: ${query.query}`);
    return this.symptomAnalysisService.getSuggestions(query);
  }

  @Post('adaptive-questions')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Generate adaptive follow-up questions based on symptoms' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of adaptive questions based on the provided symptoms',
    type: AdaptiveQuestionnaireResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async generateAdaptiveQuestions(
    @Body() input: AdaptiveQuestionnaireInput
  ): Promise<AdaptiveQuestionnaireResponse> {
    this.logger.log(`Generating adaptive questions for symptom: ${input.primarySymptom.name}`);
    return this.symptomAnalysisService.generateQuestions(input);
  }

  @MessagePattern({ cmd: 'generate_adaptive_questions' })
  async generateQuestionsMessage(
    @Payload() input: AdaptiveQuestionnaireInput
  ): Promise<AdaptiveQuestionnaireResponse> {
    this.logger.log(`Received message to generate questions for symptom: ${input.primarySymptom.name}`);
    return this.symptomAnalysisService.generateQuestions(input);
  }

  @Post('symptom-timeline')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Update symptom progression timeline with new event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns updated timeline analysis with trends and recommendations',
    type: SymptomTimelineResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async updateSymptomTimeline(
    @Body() input: SymptomTimelineInput
  ): Promise<SymptomTimelineResponse> {
    this.logger.log(`Updating timeline for symptom: ${input.symptomId}`);
    return this.symptomAnalysisService.updateTimeline(input);
  }

  @MessagePattern({ cmd: 'update_symptom_timeline' })
  async updateTimelineMessage(
    @Payload() input: SymptomTimelineInput
  ): Promise<SymptomTimelineResponse> {
    this.logger.log(`Received message to update timeline for symptom: ${input.symptomId}`);
    return this.symptomAnalysisService.updateTimeline(input);
  }

  @Get('symptom-history/:userId')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Get complete symptom history for a user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'Unique identifier of the user',
    example: 'USR-1234567'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns complete symptom history with analysis',
    type: SymptomHistoryResponse
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No symptoms found for the user'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format'
  })
  async getSymptomHistory(
    @Param('userId') userId: string
  ): Promise<SymptomHistoryResponse> {
    this.logger.log(`Fetching symptom history for user: ${userId}`);
    return this.symptomAnalysisService.getHistory(userId);
  }

  @MessagePattern({ cmd: 'get_symptom_history' })
  async getHistoryMessage(
    @Payload() data: { userId: string }
  ): Promise<SymptomHistoryResponse> {
    this.logger.log(`Received message to fetch symptom history for user: ${data.userId}`);
    return this.symptomAnalysisService.getHistory(data.userId);
  }

  @Post('symptom-analysis')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Analyze symptoms using multiple specialized LLM models' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns comprehensive symptom analysis with multiple specialist perspectives',
    type: MultiLLMAnalysisResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async analyzeSymptoms(
    @Body() input: SymptomAnalysisInput
  ): Promise<MultiLLMAnalysisResponse> {
    this.logger.log(`Analyzing symptoms with multi-LLM orchestration for: ${input.primarySymptom.name}`);
    return this.symptomAnalysisService.analyzeSymptoms(input);
  }

  @MessagePattern({ cmd: 'analyze_symptoms_llm' })
  async analyzeSymptomsMessage(
    @Payload() input: SymptomAnalysisInput
  ): Promise<MultiLLMAnalysisResponse> {
    this.logger.log(`Received message to analyze symptoms with LLM for: ${input.primarySymptom.name}`);
    return this.symptomAnalysisService.analyzeSymptoms(input);
  }
} 