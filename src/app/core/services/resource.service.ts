import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { Resource, ResourceCategory } from '../models/resource.model';

const STUDY_GUIDES: Resource[] = [
  {
    id: 'cer-guide',
    title: 'CER Quick Reference Guide',
    slug: 'cer-guide',
    category: 'cer-writing',
    order: 1,
    summary: 'Templates for writing Claim/Evidence/Reasoning sections: Data Trend, Variation, Outliers, and Conclusion.',
    fileName: 'exd-cer-guide.md',
    coachOnly: false,
  },
  {
    id: 'cer-homework',
    title: 'CER Practice Homework',
    slug: 'cer-homework',
    category: 'cer-writing',
    order: 2,
    summary: 'Practice problem: Effect of Ramp Height on Ball Roll Distance. Includes data table, graphing, and CER writing exercises.',
    fileName: 'exd-cer-homework.md',
    coachOnly: false,
  },
  {
    id: 'cer-homework-answer-key',
    title: 'CER Homework Answer Key',
    slug: 'cer-homework-answer-key',
    category: 'cer-writing',
    order: 3,
    summary: 'Complete worked solutions for the CER practice homework with step-by-step calculations.',
    fileName: 'exd-cer-homework-answer-key.md',
    coachOnly: true,
  },
  {
    id: 'iqr-stddev-reference',
    title: 'IQR & Standard Deviation Reference',
    slug: 'iqr-stddev-reference',
    category: 'statistics',
    order: 1,
    summary: 'Focused guide on IQR and Standard Deviation with step-by-step examples and calculation templates.',
    fileName: 'exd-iqr-stddev-reference.md',
    coachOnly: false,
  },
  {
    id: 'statistics-reference',
    title: 'Statistics Reference Guide',
    slug: 'statistics-reference',
    category: 'statistics',
    order: 2,
    summary: 'Comprehensive guide covering mean, median, mode, range, data tables, graphs, and experimental error types.',
    fileName: 'exd-statistics-reference.md',
    coachOnly: false,
  },
  {
    id: 'event-timeline',
    title: 'Event Timeline & Roles',
    slug: 'event-timeline',
    category: 'team-strategy',
    order: 1,
    summary: 'Time allocation and parallel role workflow for the ~50-minute competition event.',
    fileName: 'exd-event-timeline.md',
    coachOnly: false,
  },
  {
    id: 'team-strategy',
    title: 'Team Strategy & Point Allocation',
    slug: 'team-strategy',
    category: 'team-strategy',
    order: 2,
    summary: 'Detailed role assignments (Designer, Data Lead, Analyst) and section-by-section point values.',
    fileName: 'exd-team-strategy.md',
    coachOnly: false,
  },
  {
    id: 'applications',
    title: 'Experiment Applications Reference',
    slug: 'applications',
    category: 'applications',
    order: 1,
    summary: '10 experiment topics with improvement ideas, real-world applications, and future experiment suggestions.',
    fileName: 'exd-applications.md',
    coachOnly: false,
  },
  {
    id: 'practice-parachute-drop',
    title: 'Practice Event: Parachute Drop',
    slug: 'practice-parachute-drop',
    category: 'practice-events',
    order: 1,
    summary: 'Design an experiment to investigate how a variable affects parachute drop time. Includes materials list and setup.',
    fileName: 'practice-event-parachute-drop.md',
    coachOnly: false,
  },
  {
    id: 'practice-parachute-drop-teacher-guide',
    title: 'Parachute Drop — Teacher Guide',
    slug: 'practice-parachute-drop-teacher-guide',
    category: 'practice-events',
    order: 2,
    summary: 'Instructor guide with viable approaches, expected data, and quality ratings.',
    fileName: 'practice-event-parachute-drop-teacher-guide.md',
    coachOnly: true,
  },
  {
    id: 'practice-parachute-drop-answer-key',
    title: 'Parachute Drop — Answer Key',
    slug: 'practice-parachute-drop-answer-key',
    category: 'practice-events',
    order: 3,
    summary: 'Comprehensive answer key with two full experiments, statistics, graphs, and CER sections.',
    fileName: 'practice-event-parachute-drop-answer-key.md',
    coachOnly: true,
  },
  {
    id: 'practice-parachute-drop-completed-report',
    title: 'Parachute Drop — Model Report',
    slug: 'practice-parachute-drop-completed-report',
    category: 'practice-events',
    order: 4,
    summary: 'Example of an ideal ~50-minute competition report, covering all sections with detailed reasoning.',
    fileName: 'practice-event-parachute-drop-completed-report.md',
    coachOnly: true,
  },
  {
    id: 'practice-sugar-solubility',
    title: 'Practice Event: Sugar Solubility',
    slug: 'practice-sugar-solubility',
    category: 'practice-events',
    order: 5,
    summary: 'Design an experiment to understand sugar dissolution in water. Scenario-based prompt with practical constraints.',
    fileName: 'practice-event-sugar-solubility.md',
    coachOnly: false,
  },
  {
    id: 'practice-sugar-solubility-teacher-guide',
    title: 'Sugar Solubility — Teacher Guide',
    slug: 'practice-sugar-solubility-teacher-guide',
    category: 'practice-events',
    order: 6,
    summary: 'Teacher guide with materials prep, feasibility ratings, expected dissolution times, and timing budget.',
    fileName: 'practice-event-sugar-solubility-teacher-guide.md',
    coachOnly: true,
  },
  {
    id: 'practice-diffusion',
    title: 'Practice Event: Diffusion',
    slug: 'practice-diffusion',
    category: 'practice-events',
    order: 7,
    summary: 'Design an experiment to investigate a factor that affects the rate of diffusion. Includes beakers, hotplate, food coloring, and more.',
    fileName: 'practice-event-diffusion.md',
    coachOnly: false,
  },
];

export interface CategoryInfo {
  id: ResourceCategory;
  label: string;
  icon: string;
  description: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'cer-writing',
    label: 'CER Writing',
    icon: 'edit_note',
    description: 'Learn to write Claim/Evidence/Reasoning sections',
  },
  {
    id: 'statistics',
    label: 'Statistics',
    icon: 'calculate',
    description: 'Mean, median, IQR, standard deviation, and more',
  },
  {
    id: 'team-strategy',
    label: 'Team Strategy',
    icon: 'groups',
    description: 'Event timeline, role assignments, and point allocation',
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: 'science',
    description: 'Real-world applications and experiment improvement ideas',
  },
  {
    id: 'practice-events',
    label: 'Practice Events',
    icon: 'assignment',
    description: 'Full simulated practice experiments with prompts and materials',
  },
];

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly firestore = inject(Firestore);
  readonly hiddenGuideIds = signal<Set<string>>(new Set());
  readonly hiddenGuidesLoaded = signal(false);

  async loadHiddenGuides(): Promise<void> {
    const snap = await getDoc(doc(this.firestore, 'settings/hiddenGuides'));
    if (snap.exists()) {
      const ids: string[] = snap.data()['ids'] ?? [];
      this.hiddenGuideIds.set(new Set(ids));
    }
    this.hiddenGuidesLoaded.set(true);
  }

  async toggleGuideVisibility(guideId: string): Promise<void> {
    const current = new Set(this.hiddenGuideIds());
    if (current.has(guideId)) {
      current.delete(guideId);
    } else {
      current.add(guideId);
    }
    this.hiddenGuideIds.set(current);
    await setDoc(doc(this.firestore, 'settings/hiddenGuides'), { ids: [...current] });
  }
  getCategories(): CategoryInfo[] {
    return CATEGORIES.filter((c) => c.id !== 'practice-events');
  }

  getGuidesByCategory(category: ResourceCategory): Resource[] {
    return STUDY_GUIDES.filter((g) => g.category === category);
  }

  getAllGuides(includeCoachOnly: boolean): Resource[] {
    const guides = STUDY_GUIDES.filter((g) => g.category !== 'practice-events');
    if (includeCoachOnly) {
      return guides;
    }
    const hidden = this.hiddenGuideIds();
    return guides.filter((g) => !g.coachOnly && !hidden.has(g.id));
  }

  getGuideBySlug(slug: string): Resource | undefined {
    return STUDY_GUIDES.find((g) => g.slug === slug);
  }

  getTotalCount(includeCoachOnly: boolean): number {
    return this.getAllGuides(includeCoachOnly).length;
  }
}
