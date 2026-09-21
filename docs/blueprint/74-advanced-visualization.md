# 74 — Advanced Data Visualization and Infographics

## 1. Visualization Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Advanced Data Visualization                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Chart     │  │   Layout    │  │   Export Engine          │ │
│  │   Engine    │  │   Engine    │  │                         │ │
│  │             │  │             │  │ - SVG/PNG/PDF           │ │
│  │ - D3.js     │  │ - Grid      │  │ - Interactive           │ │
│  │ - Chart.js  │  │ - Flex      │  │ - Animation             │ │
│  │ - Three.js  │  │ - Canvas    │  │ - Accessibility         │ │
│  │ - Deck.gl   │  │ - Masonry   │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Visualization     │                        │
│                   │   Component Library │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Chart Engine

```typescript
// visualization/engines/chart-engine.service.ts
@Injectable()
export class ChartEngineService {
  async renderChart(config: ChartConfig): Promise<ChartRenderResult> {
    const engine = this.getEngine(config.type);

    return engine.render(config);
  }

  private getEngine(type: string): ChartEngine {
    switch (type) {
      case 'line':
        return new D3LineChartEngine();
      case 'bar':
        return new D3BarChartEngine();
      case 'pie':
        return new ChartJsPieEngine();
      case 'scatter':
        return new D3ScatterEngine();
      case 'treemap':
        return new D3TreemapEngine();
      case 'sankey':
        return new D3SankeyEngine();
      case '3d':
        return new ThreeJsEngine();
      case 'geo':
        return new DeckGlGeoEngine();
      default:
        throw new UnknownChartTypeException(type);
    }
  }
}
```

## 3. D3.js Integration

```typescript
// visualization/engines/d3-line-chart.engine.ts
@Injectable()
export class D3LineChartEngine implements ChartEngine {
  readonly type = 'line';

  async render(config: ChartConfig): Promise<ChartRenderResult> {
    const svg = d3.select('svg')
      .attr('width', config.width)
      .attr('height', config.height);

    const xScale = d3.scaleTime()
      .domain(d3.extent(config.data, (d) => d.x))
      .range([0, config.width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(config.data, (d) => d.y)])
      .range([config.height, 0]);

    // Draw axes
    svg.append('g')
      .attr('transform', `translate(0,${config.height})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Draw line
    const line = d3.line<ChartPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(config.data)
      .attr('fill', 'none')
      .attr('stroke', config.color || '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    return { svg: svg.node()?.outerHTML || '' };
  }
}
```

## 4. Layout Engine

```typescript
// visualization/layouts/layout-engine.service.ts
@Injectable()
export class LayoutEngineService {
  async arrangeCharts(charts: Chart[], container: Container): Promise<Layout> {
    switch (container.type) {
      case 'grid':
        return this.arrangeGrid(charts, container);
      case 'flex':
        return this.arrangeFlex(charts, container);
      case 'masonry':
        return this.arrangeMasonry(charts, container);
      case 'canvas':
        return this.arrangeCanvas(charts, container);
      default:
        throw new UnknownLayoutTypeException(container.type);
    }
  }

  private arrangeGrid(charts: Chart[], container: Container): Layout {
    const cols = container.columns || 12;
    const gap = container.gap || 16;

    const rows: ChartRow[] = [];
    let currentRow: ChartRow = { charts: [], width: 0 };

    for (const chart of charts) {
      const chartWidth = chart.width || Math.ceil(cols / charts.length);

      if (currentRow.width + chartWidth > cols) {
        rows.push(currentRow);
        currentRow = { charts: [], width: 0 };
      }

      currentRow.charts.push({ ...chart, width: chartWidth });
      currentRow.width += chartWidth;
    }

    if (currentRow.charts.length > 0) {
      rows.push(currentRow);
    }

    return { type: 'grid', rows };
  }
}
```

## 5. Export Engine

```typescript
// visualization/export/export-engine.service.ts
@Injectable()
export class ExportEngineService {
  async exportChart(chart: Chart, format: ExportFormat): Promise<Buffer> {
    switch (format) {
      case 'svg':
        return this.exportSvg(chart);
      case 'png':
        return this.exportPng(chart);
      case 'pdf':
        return this.exportPdf(chart);
      case 'csv':
        return this.exportCsv(chart);
      default:
        throw new UnsupportedExportFormatException(format);
    }
  }

  async exportDashboard(dashboard: Dashboard, format: ExportFormat): Promise<Buffer> {
    const pages: Buffer[] = [];

    for (const chart of dashboard.charts) {
      const chartBuffer = await this.exportChart(chart, format);
      pages.push(chartBuffer);
    }

    if (format === 'pdf') {
      return this.combinePdf(pages);
    }

    throw new UnsupportedDashboardExportFormatException(format);
  }

  private async exportPng(chart: Chart): Promise<Buffer> {
    const svg = chart.svg;
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(Buffer.from(canvas.toBuffer('image/png')));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
```

## 6. Infographic Generator

```typescript
// visualization/infographics/infographic-generator.service.ts
@Injectable()
export class InfographicGeneratorService {
  async generate(template: InfographicTemplate, data: InfographicData): Promise<Infographic> {
    const layout = await this.layoutEngine.arrange(template.sections, data);

    const sections: InfographicSection[] = [];

    for (const section of template.sections) {
      const sectionData = data[section.dataKey];

      switch (section.type) {
        case 'header':
          sections.push(await this.renderHeader(section, sectionData));
          break;
        case 'stat':
          sections.push(await this.renderStat(section, sectionData));
          break;
        case 'chart':
          sections.push(await this.renderChart(section, sectionData));
          break;
        case 'table':
          sections.push(await this.renderTable(section, sectionData));
          break;
        case 'text':
          sections.push(await this.renderText(section, sectionData));
          break;
      }
    }

    return {
      template: template.id,
      sections,
      metadata: {
        generatedAt: new Date(),
        size: { width: template.width, height: template.height },
      },
    };
  }
}
```

## 7. Accessibility

```typescript
// visualization/accessibility/accessibility.service.ts
@Injectable()
export class AccessibilityService {
  async addAccessibility(chart: Chart): Promise<AccessibleChart> {
    const ariaLabels = await this.generateAriaLabels(chart);
    const altText = await this.generateAltText(chart);
    const descriptions = await this.generateDescriptions(chart);
    const keyboardNav = await this.generateKeyboardNavigation(chart);

    return {
      ...chart,
      ariaLabels,
      altText,
      descriptions,
      keyboardNav,
    };
  }

  private async generateAriaLabels(chart: Chart): Promise<AriaLabels> {
    return {
      chart: `Chart showing ${chart.title}. ${chart.description}`,
      xAxis: `X-axis: ${chart.xAxis.title}`,
      yAxis: `Y-axis: ${chart.yAxis.title}`,
      data: `Data points: ${chart.data.length} values`,
    };
  }

  private async generateAltText(chart: Chart): Promise<string> {
    const summary = await this.summarizeData(chart.data);

    return `${chart.title}. ${chart.description}. ` +
      `The chart shows ${summary.trend} trend with values ranging from ${summary.min} to ${summary.max}.`;
  }
}
```

## 8. Animation Engine

```typescript
// visualization/animation/animation-engine.service.ts
@Injectable()
export class AnimationEngineService {
  async animate(chart: Chart, animation: ChartAnimation): Promise<void> {
    const engine = this.getAnimationEngine(animation.type);

    switch (animation.type) {
      case 'fade':
        await engine.fade(chart, animation.duration);
        break;
      case 'slide':
        await engine.slide(chart, animation.direction, animation.duration);
        break;
      case 'scale':
        await engine.scale(chart, animation.from, animation.to, animation.duration);
        break;
      case 'morph':
        await engine.morph(chart, animation.fromState, animation.toState, animation.duration);
        break;
      case 'path':
        await engine.animatePath(chart, animation.path, animation.duration);
        break;
    }
  }
}
```

## 9. Dashboard Builder

```typescript
// visualization/dashboard/dashboard-builder.service.ts
@Injectable()
export class DashboardBuilderService {
  async createDashboard(dto: CreateDashboardDto): Promise<Dashboard> {
    return this.prisma.dashboard.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        description: dto.description,
        layout: dto.layout,
        charts: dto.charts,
        filters: dto.filters,
        createdBy: dto.userId,
      },
    });
  }

  async renderDashboard(dashboardId: string): Promise<DashboardRenderResult> {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { id: dashboardId },
      include: { charts: true },
    });

    const chartResults = await Promise.all(
      dashboard.charts.map((chart) => this.renderChart(chart)),
    );

    return {
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        layout: dashboard.layout,
      },
      charts: chartResults,
    };
  }
}
```

## 10. Real-Time Updates

```typescript
// visualization/realtime/realtime-updater.service.ts
@Injectable()
export class RealtimeUpdaterService {
  @WebSocketGateway()
  export class VisualizationGateway implements OnGatewayConnection, OnGatewayDisconnection {
    @SubscribeMessage('subscribeChart')
    async subscribeChart(client: Socket, chartId: string): Promise<void> {
      client.join(`chart:${chartId}`);
    }

    @SubscribeMessage('unsubscribeChart')
    async unsubscribeChart(client: Socket, chartId: string): Promise<void> {
      client.leave(`chart:${chartId}`);
    }
  }

  async pushUpdate(chartId: string, data: ChartData): Promise<void> {
    this.server.to(`chart:${chartId}`).emit('chartUpdate', {
      chartId,
      data,
      timestamp: new Date(),
    });
  }
}
```
