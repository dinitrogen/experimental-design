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

@Injectable({ providedIn: 'root' })
export class AiDataService {
  private readonly functions = inject(Functions);

  async generateData(request: GenerateDataRequest): Promise<{ dataTable: DataTableEntry[]; notes: string }> {
    const callable = httpsCallable<GenerateDataRequest, GenerateDataResponse>(
      this.functions,
      'generateExperimentData'
    );

    const result = await callable(request);
    const response = result.data;

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
