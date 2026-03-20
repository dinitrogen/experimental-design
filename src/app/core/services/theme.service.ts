import { Injectable, signal, effect } from '@angular/core';
import { ThemeName } from '../models/theme.model';

const STORAGE_KEY = 'exd-theme';
const VALID_THEMES: ThemeName[] = ['light', 'dark', 'cardinal'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<ThemeName>(this.loadTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    // Apply the theme attribute immediately (matches the inline script in index.html)
    document.documentElement.setAttribute('data-theme', this._theme());

    effect(() => {
      const theme = this._theme();
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // storage unavailable
      }
    });
  }

  setTheme(theme: ThemeName): void {
    this._theme.set(theme);
  }

  private loadTheme(): ThemeName {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (stored && VALID_THEMES.includes(stored)) {
        return stored;
      }
    } catch {
      // storage unavailable
    }
    return 'light';
  }
}
