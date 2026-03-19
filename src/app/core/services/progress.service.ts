import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ReadingProgress } from '../models/resource.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  async getProgress(resourceId: string): Promise<ReadingProgress | null> {
    const user = this.authService.user();
    if (!user) return null;

    const progressDoc = doc(this.firestore, `progress/${user.uid}/items/${resourceId}`);
    const snapshot = await getDoc(progressDoc);

    if (snapshot.exists()) {
      return snapshot.data() as ReadingProgress;
    }
    return null;
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    const user = this.authService.user();
    if (!user) return [];

    const progressCol = collection(this.firestore, `progress/${user.uid}/items`);
    const snapshot = await getDocs(progressCol);
    return snapshot.docs.map((d) => d.data() as ReadingProgress);
  }

  async markCompleted(resourceId: string): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    const progressDoc = doc(this.firestore, `progress/${user.uid}/items/${resourceId}`);
    await setDoc(progressDoc, {
      resourceId,
      status: 'completed',
      completedAt: Timestamp.now(),
    } satisfies ReadingProgress);
  }

  async getCompletedCount(): Promise<number> {
    const user = this.authService.user();
    if (!user) return 0;

    const progressCol = collection(this.firestore, `progress/${user.uid}/items`);
    const q = query(progressCol, where('status', '==', 'completed'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }
}
