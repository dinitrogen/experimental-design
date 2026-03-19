import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AppUser, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  private readonly currentUser = signal<AppUser | null>(null);
  private readonly loading = signal(true);

  readonly user = this.currentUser.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly role = computed<UserRole | null>(() => this.currentUser()?.role ?? null);
  readonly isCoach = computed(() => this.role() === 'coach');
  readonly needsPasswordChange = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return !user.passwordChanged;
  });

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await this.loadUserProfile(firebaseUser);
        } else {
          this.currentUser.set(null);
        }
      } finally {
        this.loading.set(false);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    await this.loadUserProfile(credential.user);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser.set(null);
  }

  async changePassword(newPassword: string): Promise<void> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) throw new Error('Not authenticated');
    await updatePassword(firebaseUser, newPassword);
    await updateDoc(doc(this.firestore, `users/${firebaseUser.uid}`), {
      passwordChanged: true,
    });
    this.currentUser.update((u) => u ? { ...u, passwordChanged: true } : u);
  }

  private async loadUserProfile(firebaseUser: User): Promise<void> {
    const userDoc = doc(this.firestore, `users/${firebaseUser.uid}`);
    const snapshot = await getDoc(userDoc);

    if (snapshot.exists()) {
      const data = snapshot.data();
      this.currentUser.set({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: data['displayName'] ?? '',
        role: data['role'] ?? 'student',
        createdAt: data['createdAt'] ?? Timestamp.now(),
        middleSchool: data['middleSchool'] ?? undefined,
        grade: data['grade'] ?? undefined,
        passwordChanged: data['passwordChanged'] ?? false,
      });
    } else {
      // Profile not yet created — default to student
      this.currentUser.set({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? '',
        role: 'student',
        createdAt: Timestamp.now(),
      });
    }
  }
}
