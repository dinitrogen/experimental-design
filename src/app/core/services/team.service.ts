import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { TeamEvent, RoleAssignments } from '../models/team-event.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly firestore = inject(Firestore);
  private readonly functions = inject(Functions);

  async getTeamEvents(): Promise<TeamEvent[]> {
    const col = collection(this.firestore, 'teamEvents');
    const snapshot = await getDocs(col);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as TeamEvent)
      .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''));
  }

  async saveTeamEvent(event: TeamEvent): Promise<string> {
    const id = event.id ?? doc(collection(this.firestore, 'teamEvents')).id;
    await setDoc(doc(this.firestore, `teamEvents/${id}`), {
      title: event.title,
      location: event.location ?? null,
      eventDate: event.eventDate ?? null,
      teams: event.teams.map((t) => ({
        schoolName: t.schoolName,
        teamName: t.teamName ?? null,
        memberUids: t.memberUids,
        roleAssignments: t.roleAssignments ?? {},
      })),
      alternateUids: event.alternateUids ?? [],
      createdAt: event.createdAt ?? Timestamp.now(),
    });
    return id;
  }

  async updateRoleAssignments(
    eventId: string,
    teamIndex: number,
    assignments: RoleAssignments,
  ): Promise<void> {
    const callable = httpsCallable<
      { eventId: string; teamIndex: number; assignments: RoleAssignments },
      { success: boolean }
    >(this.functions, 'updateTeamRoleAssignments');
    await callable({ eventId, teamIndex, assignments });
  }

  async removeTeamEvent(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `teamEvents/${id}`));
  }
}
