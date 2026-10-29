import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc, setDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { GuideWorkspace, isGuideWorkspace } from './workspace.model';

@Injectable({ providedIn: 'root' })
export class InteractiveWorkspaceService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private document() {
    const uid = this.auth.user()?.uid;
    if (!uid) throw new Error('Please sign in again to access your workspace.');
    return doc(this.firestore, 'interactiveGuideWorkspaces', uid);
  }

  async load(): Promise<GuideWorkspace | null> {
    const snapshot = await getDoc(this.document());
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (data['version'] !== 1 || typeof data['workspace'] !== 'string') {
      throw new Error('The saved workspace format is not supported. Your saved work was not changed.');
    }
    let workspace: unknown;
    try {
      workspace = JSON.parse(data['workspace']);
    } catch {
      throw new Error('The saved workspace could not be read. Your saved work was not changed.');
    }
    if (!isGuideWorkspace(workspace)) {
      throw new Error('The saved workspace is incomplete or invalid. Your saved work was not changed.');
    }
    return workspace;
  }

  async save(workspace: GuideWorkspace): Promise<void> {
    await setDoc(this.document(), {
      version: 1,
      workspace: JSON.stringify(workspace),
      updatedAt: Timestamp.now(),
    });
  }
}
