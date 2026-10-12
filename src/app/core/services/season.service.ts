import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, collection, getDocs } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';

export type RolloverAction = 'enroll' | 'reactivate' | 'archive' | 'none';

export interface RolloverCounts {
  progress: number;
  loginHistory: number;
  submissions: number;
  taskSubmissions: number;
  taskAssignments: number;
  teamEvents: number;
  returningMemberAwards: number;
  legacyAchievements: number;
  carriedAchievements: number;
}

export interface RolloverStudent {
  uid: string;
  displayName: string;
  archived: boolean;
  returning: boolean;
  action: RolloverAction;
}

export interface RolloverPreview {
  dryRun: true;
  seasonId: string;
  existingStatus: string | null;
  counts: RolloverCounts;
  students: RolloverStudent[];
}

export interface RolloverResult {
  success: true;
  seasonId: string;
  status: 'complete';
  counts: RolloverCounts;
  students: RolloverStudent[];
}

export interface SeasonRecord {
  id: string;
  status: string;
  completedAt: Date | null;
}

interface RolloverRequest {
  seasonId: string;
  returningUids: string[];
  dryRun?: boolean;
  confirmSeasonId?: string;
  backupConfirmed?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeasonService {
  private readonly firestore = inject(Firestore);
  private readonly functions = inject(Functions);

  /** Dry run: returns counts and planned student changes. Writes nothing. */
  previewRollover(seasonId: string, returningUids: string[]): Promise<RolloverPreview> {
    return this.callRollover<RolloverPreview>({ seasonId, returningUids, dryRun: true });
  }

  /** Real run. The server re-checks the typed season ID and backup confirmation. */
  runRollover(params: {
    seasonId: string;
    returningUids: string[];
    confirmSeasonId: string;
    backupConfirmed: boolean;
  }): Promise<RolloverResult> {
    return this.callRollover<RolloverResult>({
      seasonId: params.seasonId,
      returningUids: params.returningUids,
      dryRun: false,
      confirmSeasonId: params.confirmSeasonId,
      backupConfirmed: params.backupConfirmed,
    });
  }

  async getSeasons(): Promise<SeasonRecord[]> {
    const snapshot = await getDocs(collection(this.firestore, 'seasons'));
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const completedAt = data['completedAt'] as Timestamp | undefined;
        return {
          id: doc.id,
          status: data['status'] ?? 'unknown',
          completedAt: completedAt ? completedAt.toDate() : null,
        };
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }

  /** Newest season ID (seasons are named like 2026-2027), or null before the first rollover. */
  async getCurrentSeasonId(): Promise<string | null> {
    const seasons = await this.getSeasons();
    return seasons[0]?.id ?? null;
  }

  private async callRollover<T>(request: RolloverRequest): Promise<T> {
    const fn = httpsCallable<RolloverRequest, T>(this.functions, 'rolloverSeason');
    const response = await fn(request);
    return response.data;
  }
}
