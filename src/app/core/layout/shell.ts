import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { THEME_OPTIONS, ThemeName } from '../../core/models/theme.model';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="sidenavOpen()"
        (openedChange)="sidenavOpen.set($event)"
        role="navigation"
        aria-label="Main navigation"
      >
        <div class="sidenav-header">
          <mat-icon class="logo-icon">science</mat-icon>
          <span class="logo-text">XD Lab</span>
          @if (!isMobile()) {
            <button
              mat-icon-button
              class="collapse-button"
              (click)="sidenavOpen.set(false)"
              aria-label="Collapse menu"
              matTooltip="Collapse menu"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
          }
        </div>

        <mat-nav-list>
          @for (item of navItems(); track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active-link"
              (click)="onNavClick()"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <button mat-button (click)="logout()" class="logout-button">
            <mat-icon>logout</mat-icon>
            Sign Out
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          @if (isMobile()) {
            <button
              mat-icon-button
              (click)="sidenav.toggle()"
              aria-label="Open navigation menu"
              matTooltip="Menu"
            >
              <mat-icon>menu</mat-icon>
            </button>
          } @else if (!sidenavOpen()) {
            <button
              mat-icon-button
              (click)="sidenavOpen.set(true)"
              aria-label="Expand navigation menu"
              matTooltip="Expand menu"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          }
          @if (isMobile() || !sidenavOpen()) {
            <span class="toolbar-title">XD Lab</span>
          }
          <span class="toolbar-spacer"></span>
          <span class="user-name">{{ userName() }}</span>
          <button
            mat-icon-button
            [matMenuTriggerFor]="settingsMenu"
            aria-label="Settings"
            matTooltip="Settings"
          >
            <mat-icon>settings</mat-icon>
          </button>
          <mat-menu #settingsMenu="matMenu">
            <div class="menu-section-label">Theme</div>
            @for (option of themeOptions; track option.name) {
              <button mat-menu-item (click)="setTheme(option.name)">
                <mat-icon>{{ theme() === option.name ? 'radio_button_checked' : option.icon }}</mat-icon>
                <span>{{ option.label }}</span>
              </button>
            }
          </mat-menu>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell-container {
      height: 100vh;
    }

    mat-sidenav {
      width: 260px;
      display: flex;
      flex-direction: column;
      background-color: var(--sidenav-bg);
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .collapse-button {
      margin-left: auto;
    }

    .logo-icon {
      color: var(--logo-color);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 500;
    }

    .sidenav-footer {
      margin-top: auto;
      border-top: 1px solid var(--border-color);
      padding: 8px;
    }

    .logout-button {
      width: 100%;
      justify-content: flex-start;
    }

    .active-link {
      background: var(--active-link-bg) !important;
      color: var(--active-link-color);
    }

    .toolbar-title {
      margin-left: 8px;
      font-weight: 400;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .user-name {
      font-size: 14px;
      opacity: 0.9;
    }

    .menu-section-label {
      padding: 8px 16px 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.6;
    }

    .main-content {
      min-height: calc(100vh - 64px);
    }
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private breakpointSub?: Subscription;

  protected readonly isMobile = signal(false);
  protected readonly sidenavOpen = signal(true);
  protected readonly theme = this.themeService.theme;
  protected readonly themeOptions = THEME_OPTIONS;

  protected readonly userName = computed(
    () => this.authService.user()?.displayName || this.authService.user()?.email || ''
  );

  private readonly studentNav: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Tasks', route: '/tasks', icon: 'task_alt' },
    { label: 'Study Guides', route: '/study-guides', icon: 'menu_book' },
    { label: 'Practice Events', route: '/practice-events', icon: 'assignment' },
    { label: 'Team', route: '/team', icon: 'groups' },
  ];

  private readonly coachNav: NavItem[] = [
    { label: 'Coach Dashboard', route: '/coach', icon: 'dashboard' },
    { label: 'Tasks', route: '/tasks', icon: 'task_alt' },
    { label: 'Students', route: '/coach/students', icon: 'people' },
    { label: 'Reviews', route: '/coach/submissions', icon: 'rate_review' },
    { label: 'Study Guides', route: '/study-guides', icon: 'menu_book' },
    { label: 'Practice Events', route: '/practice-events', icon: 'assignment' },
    { label: 'Team', route: '/team', icon: 'groups' },
  ];

  protected readonly navItems = computed(() =>
    this.authService.isCoach() ? this.coachNav : this.studentNav
  );

  ngOnInit(): void {
    this.breakpointSub = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        if (result.matches) {
          this.sidenavOpen.set(false);
        } else {
          this.sidenavOpen.set(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
  }

  protected onNavClick(): void {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  protected setTheme(theme: ThemeName): void {
    this.themeService.setTheme(theme);
  }

  protected async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } finally {
      window.location.href = '/login';
    }
  }
}
