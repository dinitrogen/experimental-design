import { Injectable, signal, computed } from '@angular/core';

export interface PracticeSettings {
  showHints: boolean;
  checkMyWork: boolean;
}

const STORAGE_KEY = 'exd-practice-settings';

const DEFAULTS: PracticeSettings = {
  showHints: true,
  checkMyWork: true,
};

@Injectable({ providedIn: 'root' })
export class PracticeSettingsService {
  private readonly _settings = signal<PracticeSettings>(this.load());

  readonly settings = this._settings.asReadonly();
  readonly showHints = computed(() => this._settings().showHints);
  readonly checkMyWork = computed(() => this._settings().checkMyWork);

  update(partial: Partial<PracticeSettings>): void {
    const updated = { ...this._settings(), ...partial };
    this._settings.set(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage unavailable
    }
  }

  private load(): PracticeSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULTS, ...JSON.parse(raw) };
      }
    } catch {
      // storage unavailable
    }
    return { ...DEFAULTS };
  }
}
