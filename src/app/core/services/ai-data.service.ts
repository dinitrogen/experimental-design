import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { DataTableEntry } from '../models/submission.model';

export interface GenerateDataRequest {
  independentVar: string;
  dependentVar: string;
  controlledVars: string[];
  hypothesis: string;
  procedure: string;
  ivValues: string[];
  numTrials: number;
}

export interface GenerateDataResponse {
  rows: {
    ivValue: string;
    trial1: number;
    trial2: number;
    trial3: number;
    trial4: number | null;
    trial5: number | null;
  }[];
  notes: string;
}

const AI_GENERIC_ERROR = 'The AI service had a problem generating data. Try again in a moment, or enter the data manually.';

/** Converts Firebase callable errors into messages students can act on. */
function toFriendlyAiError(error: unknown): Error {
  const code = (error as { code?: unknown } | null)?.code;
  const message = (error as { message?: unknown } | null)?.message;
  switch (code) {
    case 'functions/unauthenticated':
      return new Error('Please sign in again to use AI generation.');
    case 'functions/failed-precondition':
      return new Error('AI generation is not turned on yet. Enter the data manually.');
    case 'functions/resource-exhausted':
    case 'functions/invalid-argument':
    case 'functions/unavailable':
      return new Error(typeof message === 'string' && message ? message : AI_GENERIC_ERROR);
    default:
      return new Error(AI_GENERIC_ERROR);
  }
}

@Injectable({ providedIn: 'root' })
export class AiDataService {
  private readonly functions = inject(Functions);

  async generateData(request: GenerateDataRequest): Promise<{ dataTable: DataTableEntry[]; notes: string }> {
    const callable = httpsCallable<GenerateDataRequest, GenerateDataResponse>(
      this.functions,
      'generateExperimentData'
    );

    let response: GenerateDataResponse;
    try {
      response = (await callable(request)).data;
    } catch (error) {
      throw toFriendlyAiError(error);
    }

    const dataTable: DataTableEntry[] = response.rows.map((row) => ({
      ivValue: row.ivValue,
      trial1: row.trial1,
      trial2: row.trial2,
      trial3: row.trial3,
      trial4: row.trial4,
      trial5: row.trial5,
      mean: null,
    }));

    return { dataTable, notes: response.notes };
  }
}
