import { ChangeDetectionStrategy, Component, input, output, effect, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { GraphData, GraphPoint } from '../../core/models/submission.model';

const M = { top: 45, right: 25, bottom: 55, left: 65 };
const W = 700;
const H = 460;
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

function niceInterval(range: number, targetTicks = 8): number {
  if (range <= 0) return 1;
  const rough = range / targetTicks;
  const p = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

@Component({
  selector: 'app-graph-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas [attr.width]="cW" [attr.height]="cH"
    role="img" [attr.aria-label]="graphData().title || 'Graph'"
    (mousedown)="onMouse($event)" (touchstart)="onTouch($event)"></canvas>`,
  styles: `
    :host { display: block; }
    canvas {
      width: 100%;
      max-width: 700px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #fff;
      touch-action: none;
    }
    :host:not(.readonly) canvas {
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cline x1='12' y1='0' x2='12' y2='24' stroke='black' stroke-width='1.5'/%3E%3Cline x1='0' y1='12' x2='24' y2='12' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 12 12, crosshair;
    }
  `,
  host: {
    '[class.readonly]': 'isReadonly()',
  },
})
export class GraphCanvasComponent {
  readonly graphData = input.required<GraphData>();
  readonly isReadonly = input(false);
  readonly lobfPending = input<GraphPoint | null>(null);
  readonly canvasClicked = output<GraphPoint>();

  protected readonly cW = W;
  protected readonly cH = H;

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private tickX = 1;
  private tickY = 1;

  constructor() {
    effect(() => {
      const data = this.graphData();
      this.lobfPending();
      const el = this.canvasRef();
      if (el) this.draw(el.nativeElement, data);
    });
    // Ensure canvas draws on first render (covers readonly views where data never changes)
    afterNextRender(() => {
      const el = this.canvasRef();
      if (el) this.draw(el.nativeElement, this.graphData());
    });
  }

  protected onMouse(e: MouseEvent): void {
    if (this.isReadonly()) return;
    e.preventDefault();
    this.emitClick(e.clientX, e.clientY);
  }

  protected onTouch(e: TouchEvent): void {
    if (this.isReadonly()) return;
    e.preventDefault();
    const t = e.touches[0];
    this.emitClick(t.clientX, t.clientY);
  }

  private emitClick(clientX: number, clientY: number): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (W / rect.width);
    const py = (clientY - rect.top) * (H / rect.height);
    if (px < M.left || px > W - M.right || py < M.top || py > H - M.bottom) return;

    const data = this.graphData();
    const rawX = data.xMin + ((px - M.left) / PW) * (data.xMax - data.xMin);
    const rawY = data.yMin + ((M.top + PH - py) / PH) * (data.yMax - data.yMin);
    const x = Math.max(data.xMin, Math.min(data.xMax, Math.round(rawX / this.tickX) * this.tickX));
    const y = Math.max(data.yMin, Math.min(data.yMax, Math.round(rawY / this.tickY) * this.tickY));
    this.canvasClicked.emit({
      x: parseFloat(x.toPrecision(10)),
      y: parseFloat(y.toPrecision(10)),
    });
  }

  private draw(canvas: HTMLCanvasElement, data: GraphData): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    if (data.chartType === 'bar') {
      this.drawBarChart(ctx, data);
    } else {
      const xRange = data.xMax - data.xMin;
      const yRange = data.yMax - data.yMin;
      if (xRange <= 0 || yRange <= 0) return;

      this.tickX = niceInterval(xRange);
      this.tickY = niceInterval(yRange);

      this.drawGrid(ctx, data);
      this.drawAxes(ctx, data);
      this.drawPoints(ctx, data);
      this.drawLobf(ctx, data);
      this.drawPending(ctx, data);
    }
    this.drawTitle(ctx, data);
  }

  private toPixel(data: GraphData, x: number, y: number): [number, number] {
    return [
      M.left + ((x - data.xMin) / (data.xMax - data.xMin)) * PW,
      M.top + PH - ((y - data.yMin) / (data.yMax - data.yMin)) * PH,
    ];
  }

  private drawGrid(ctx: CanvasRenderingContext2D, data: GraphData): void {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(data.xMin / this.tickX) * this.tickX; x <= data.xMax + this.tickX * 0.001; x += this.tickX) {
      const [px] = this.toPixel(data, x, 0);
      ctx.beginPath(); ctx.moveTo(px, M.top); ctx.lineTo(px, M.top + PH); ctx.stroke();
    }
    for (let y = Math.ceil(data.yMin / this.tickY) * this.tickY; y <= data.yMax + this.tickY * 0.001; y += this.tickY) {
      const [, py] = this.toPixel(data, 0, y);
      ctx.beginPath(); ctx.moveTo(M.left, py); ctx.lineTo(M.left + PW, py); ctx.stroke();
    }
  }

  private drawAxes(ctx: CanvasRenderingContext2D, data: GraphData): void {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M.left, M.top + PH); ctx.lineTo(M.left + PW, M.top + PH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(M.left, M.top); ctx.lineTo(M.left, M.top + PH); ctx.stroke();

    // Tick labels
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(data.xMin / this.tickX) * this.tickX; x <= data.xMax + this.tickX * 0.001; x += this.tickX) {
      const [px] = this.toPixel(data, x, 0);
      ctx.fillText(this.fmt(x), px, M.top + PH + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(data.yMin / this.tickY) * this.tickY; y <= data.yMax + this.tickY * 0.001; y += this.tickY) {
      const [, py] = this.toPixel(data, 0, y);
      ctx.fillText(this.fmt(y), M.left - 8, py);
    }

    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.xAxisLabel || 'X Axis', M.left + PW / 2, H - 15);

    ctx.save();
    ctx.translate(18, M.top + PH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.yAxisLabel || 'Y Axis', 0, 0);
    ctx.restore();
  }

  private drawPoints(ctx: CanvasRenderingContext2D, data: GraphData): void {
    ctx.fillStyle = '#1565c0';
    for (const pt of data.points ?? []) {
      const [px, py] = this.toPixel(data, pt.x, pt.y);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBarChart(ctx: CanvasRenderingContext2D, data: GraphData): void {
    const bars = data.bars ?? [];
    const yRange = data.yMax - data.yMin;
    if (yRange <= 0) return;

    this.tickY = niceInterval(yRange);

    // Horizontal grid lines only
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    for (let y = Math.ceil(data.yMin / this.tickY) * this.tickY; y <= data.yMax + this.tickY * 0.001; y += this.tickY) {
      const py = M.top + PH - ((y - data.yMin) / yRange) * PH;
      ctx.beginPath(); ctx.moveTo(M.left, py); ctx.lineTo(M.left + PW, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M.left, M.top + PH); ctx.lineTo(M.left + PW, M.top + PH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(M.left, M.top); ctx.lineTo(M.left, M.top + PH); ctx.stroke();

    // Y tick labels
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(data.yMin / this.tickY) * this.tickY; y <= data.yMax + this.tickY * 0.001; y += this.tickY) {
      const py = M.top + PH - ((y - data.yMin) / yRange) * PH;
      ctx.fillText(this.fmt(y), M.left - 8, py);
    }

    // Y-axis label
    ctx.fillStyle = '#333';
    ctx.font = '13px sans-serif';
    ctx.save();
    ctx.translate(18, M.top + PH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.yAxisLabel || 'Y Axis', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.xAxisLabel || '', M.left + PW / 2, H - 12);

    // Draw bars
    if (bars.length === 0) return;
    const n = bars.length;
    const totalBarArea = PW / n;
    const barWidth = Math.min(totalBarArea * 0.65, 70);
    const gap = (totalBarArea - barWidth) / 2;
    const baseY = M.top + PH - ((Math.max(data.yMin, 0) - data.yMin) / yRange) * PH;

    for (let i = 0; i < n; i++) {
      const bar = bars[i];
      const barLeft = M.left + i * totalBarArea + gap;
      const topY = M.top + PH - ((bar.y - data.yMin) / yRange) * PH;
      const barHeight = baseY - topY;

      ctx.fillStyle = '#1565c0';
      ctx.fillRect(barLeft, topY, barWidth, barHeight);
      ctx.strokeStyle = '#0d47a1';
      ctx.lineWidth = 1;
      ctx.strokeRect(barLeft, topY, barWidth, barHeight);

      // Category label below bar
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = bar.label.length > 12 ? bar.label.substring(0, 11) + '\u2026' : bar.label;
      ctx.fillText(label, barLeft + barWidth / 2, M.top + PH + 6);

      // Value above bar
      ctx.fillStyle = '#1565c0';
      ctx.font = 'bold 11px sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(this.fmt(bar.y), barLeft + barWidth / 2, topY - 3);
    }
  }

  private drawLobf(ctx: CanvasRenderingContext2D, data: GraphData): void {
    if (!data.lobfStart || !data.lobfEnd) return;
    const dx = data.lobfEnd.x - data.lobfStart.x;
    const dy = data.lobfEnd.y - data.lobfStart.y;

    let x1: number, y1: number, x2: number, y2: number;
    if (dx === 0) {
      x1 = x2 = data.lobfStart.x;
      y1 = data.yMin; y2 = data.yMax;
    } else {
      const slope = dy / dx;
      x1 = data.xMin;
      y1 = data.lobfStart.y + slope * (x1 - data.lobfStart.x);
      x2 = data.xMax;
      y2 = data.lobfStart.y + slope * (x2 - data.lobfStart.x);
    }

    const [px1, py1] = this.toPixel(data, x1, y1);
    const [px2, py2] = this.toPixel(data, x2, y2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(M.left, M.top, PW, PH);
    ctx.clip();

    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.restore();

    for (const pt of [data.lobfStart, data.lobfEnd]) {
      const [px, py] = this.toPixel(data, pt.x, pt.y);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawPending(ctx: CanvasRenderingContext2D, data: GraphData): void {
    const pending = this.lobfPending();
    if (!pending) return;
    const [px, py] = this.toPixel(data, pending.x, pending.y);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawTitle(ctx: CanvasRenderingContext2D, data: GraphData): void {
    if (!data.title) return;
    ctx.fillStyle = '#222';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.title, W / 2, 10);
  }

  private fmt(n: number): string {
    return parseFloat(n.toPrecision(6)).toString();
  }
}
