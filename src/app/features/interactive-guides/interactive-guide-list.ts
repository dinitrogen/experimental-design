import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-interactive-guide-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="content-container">
      <h1 class="page-title">Interactive Guides</h1>
      <p>Practice report-writing skills with guided, hands-on activities.</p>
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>show_chart</mat-icon>
          <mat-card-title>Data Tables, Statistics &amp; Graphing</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Enter trial data, practice statistics, plot means, and explore the equation of a line of best fit.</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-flat-button routerLink="/interactive-guides/data-and-graph">Open guide</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class InteractiveGuideListComponent {}
