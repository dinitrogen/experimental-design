import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GraphData, GraphPoint } from '../../core/models/submission.model';
import { GraphCanvasComponent } from './graph-canvas';

describe('GraphCanvasComponent precision', () => {
  it('supports continuous pointer positions, snapped positions, and fractional keyboard steps', async () => {
    const context: Partial<CanvasRenderingContext2D> = {
      clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
      stroke: () => {}, fillText: () => {}, save: () => {}, restore: () => {},
      translate: () => {}, rotate: () => {}, arc: () => {}, fill: () => {},
      rect: () => {}, clip: () => {}, setLineDash: () => {},
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as CanvasRenderingContext2D);
    await TestBed.configureTestingModule({ imports: [GraphCanvasComponent] }).compileComponents();
    const fixture = TestBed.createComponent(GraphCanvasComponent);
    const graph: GraphData = {
      title: '', xAxisLabel: '', yAxisLabel: '', xMin: 0, xMax: 10, yMin: 0, yMax: 10,
      points: [], lobfStart: null, lobfEnd: null, chartType: 'scatter',
    };
    fixture.componentRef.setInput('graphData', graph);
    fixture.componentRef.setInput('snapToTick', false);
    const placed: GraphPoint[] = [];
    fixture.componentInstance.canvasClicked.subscribe((point) => placed.push(point));
    fixture.detectChanges();
    await fixture.whenStable();
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 700, 460));
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 65 + 610 * 0.137, clientY: 405 - 360 * 0.268 }));
    expect(placed[0].x).toBeCloseTo(1.37);
    expect(placed[0].y).toBeCloseTo(2.68);

    fixture.componentRef.setInput('snapToTick', true);
    fixture.detectChanges();
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 65 + 610 * 0.137, clientY: 405 - 360 * 0.268 }));
    expect(placed[1]).toEqual({ x: 1, y: 3 });

    fixture.componentRef.setInput('snapToTick', false);
    fixture.detectChanges();
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(placed[2]).toEqual({ x: 0.1, y: 0 });
    vi.restoreAllMocks();
  });
});
