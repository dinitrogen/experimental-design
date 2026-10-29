import { TestBed } from '@angular/core/testing';
import { GraphCanvasComponent } from '../../../../shared/components/graph-canvas';
import { GraphStepComponent } from './graph';

describe('GraphStepComponent ranges', () => {
  it('suggests usable ranges for constant negative values', async () => {
    await TestBed.configureTestingModule({ imports: [GraphStepComponent] })
      .overrideComponent(GraphCanvasComponent, { set: { template: '' } })
      .compileComponents();
    const fixture = TestBed.createComponent(GraphStepComponent);
    fixture.componentRef.setInput('dataTable', [{
      ivValue: '-10', trial1: -5, trial2: -5, trial3: -5, trial4: null, trial5: null, mean: -5,
    }]);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const auto = [...page.querySelectorAll('button')].find((item) => item.textContent?.includes('Auto'));
    auto!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const value = (label: string) => {
      const field = [...page.querySelectorAll('mat-form-field')].find((item) => item.textContent?.includes(label));
      return Number(field?.querySelector('input')?.value);
    };
    expect(value('X Min')).toBeLessThanOrEqual(-10);
    expect(value('X Max')).toBeGreaterThanOrEqual(0);
    expect(value('Y Min')).toBeLessThanOrEqual(-5);
    expect(value('Y Max')).toBeGreaterThanOrEqual(0);
  });
});
