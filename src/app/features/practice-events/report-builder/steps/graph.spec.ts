import { TestBed } from '@angular/core/testing';
import { GraphCanvasComponent } from '../../../../shared/components/graph-canvas';
import { GraphStepComponent } from './graph';

describe('GraphStepComponent ranges', () => {
  it('displays and toggles the placement mode without changing the report default', async () => {
    await TestBed.configureTestingModule({ imports: [GraphStepComponent] })
      .overrideComponent(GraphCanvasComponent, { set: { template: '' } })
      .compileComponents();
    const report = TestBed.createComponent(GraphStepComponent);
    report.detectChanges();
    const reportButton: HTMLButtonElement = report.nativeElement.querySelector('button[aria-label="Free placement"]');
    expect(reportButton.getAttribute('aria-pressed')).toBe('false');
    expect(reportButton.textContent).toContain('Snap to grid');

    const guide = TestBed.createComponent(GraphStepComponent);
    guide.componentRef.setInput('freePlacementByDefault', true);
    guide.detectChanges();
    const button: HTMLButtonElement = guide.nativeElement.querySelector('button[aria-label="Free placement"]');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toContain('Free placement');
    expect(button.classList.contains('active-toggle')).toBe(true);
    button.click();
    guide.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toContain('Snap to grid');
    expect(button.classList.contains('active-toggle')).toBe(false);
  });

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
