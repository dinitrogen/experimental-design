import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { TeamEvent, EventTeam, RoleAssignments } from '../models/team-event.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly firestore = inject(Firestore);

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
    // Read the specific event document, update the team, write back
    const eventRef = doc(this.firestore, `teamEvents/${eventId}`);
    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) return;
    const data = snapshot.data() as TeamEvent;
    const teams = [...(data.teams ?? [])];
    if (teams[teamIndex]) {
      teams[teamIndex] = { ...teams[teamIndex], roleAssignments: assignments };
    }
    await updateDoc(eventRef, { teams });
  }

  async removeTeamEvent(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `teamEvents/${id}`));
  }
}
