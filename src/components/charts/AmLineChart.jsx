import React, { useLayoutEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

export default function AmLineChart({
  categories = [],
  series = [],
  height = 300,
  valuePrefix = '',
  valueSuffix = '',
  showBullets = true,
  smooth = true,
  showLegend = true,
  rotateXLabels = 'auto'
}) {
  const chartRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    if (root._logo) root._logo.dispose();

    const themes = [am5themes_Animated.new(root)];
    if (isDark) {
      themes.push(am5themes_Dark.new(root));
    }
    root.setThemes(themes);

    const hasLongCategory = categories.some(cat => String(cat || '').length > 8);
    const shouldRotate = rotateXLabels === true || (rotateXLabels !== false && (hasLongCategory || categories.length > 4));

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 10,
        paddingRight: 15,
        paddingBottom: shouldRotate ? 55 : 10
      })
    );

    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {
      behavior: 'none'
    }));
    cursor.lineY.set('visible', false);

    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 45,
      cellStartLocation: 0.1,
      cellEndLocation: 0.9
    });

    if (shouldRotate) {
      xRenderer.labels.template.setAll({
        rotation: -35,
        centerY: am5.p50,
        centerX: am5.p100,
        paddingRight: 5,
        fontSize: 10.5,
        oversizedBehavior: 'truncate',
        maxWidth: 105,
        tooltipText: '{category}'
      });
    } else {
      xRenderer.labels.template.setAll({
        fontSize: 11,
        oversizedBehavior: 'truncate',
        maxWidth: 90,
        tooltipText: '{category}'
      });
    }

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    const chartData = categories.map((cat, idx) => {
      const item = { category: cat };
      series.forEach((s) => {
        item[s.name] = s.data[idx] ?? 0;
      });
      return item;
    });

    xAxis.data.setAll(chartData);

    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

    series.forEach((s, idx) => {
      const sColor = s.color || palette[idx % palette.length];
      const seriesObj = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: s.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: s.name,
          categoryXField: 'category',
          tooltip: am5.Tooltip.new(root, {
            labelText: `{name}: ${valuePrefix}{valueY}${valueSuffix}`
          })
        })
      );

      seriesObj.set('stroke', am5.color(sColor));

      if (smooth) {
        seriesObj.set('tensionX', 0.8);
      }

      if (s.dashed) {
        seriesObj.strokes.template.setAll({
          strokeDasharray: [5, 5]
        });
      }

      seriesObj.strokes.template.setAll({
        strokeWidth: s.strokeWidth || 3
      });

      if (showBullets) {
        seriesObj.bullets.push(() => {
          const graphics = am5.Circle.new(root, {
            radius: 4,
            fill: am5.color(sColor),
            stroke: root.interfaceColors.get('background'),
            strokeWidth: 2
          });
          return am5.Bullet.new(root, {
            sprite: graphics
          });
        });
      }

      seriesObj.data.setAll(chartData);
      seriesObj.appear(1000);
    });

    if (showLegend && series.length > 1) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.p50,
          x: am5.p50,
          marginTop: 10
        })
      );
      legend.data.setAll(chart.series.values);
    }

    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [categories, series, isDark, valuePrefix, valueSuffix, showBullets, smooth, showLegend, rotateXLabels]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
