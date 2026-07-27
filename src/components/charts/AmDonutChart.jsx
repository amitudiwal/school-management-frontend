import React, { useLayoutEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

export default function AmDonutChart({
  data = [],
  innerRadius = 70,
  height = 260,
  centerLabel = '',
  centerValue = '',
  showLegend = false,
  valueSuffix = '%'
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

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        innerRadius: am5.percent(innerRadius),
        layout: root.verticalLayout
      })
    );

    const seriesObj = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category',
        alignLabels: false
      })
    );

    seriesObj.labels.template.set('forceHidden', true);
    seriesObj.ticks.template.set('forceHidden', true);

    seriesObj.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(isDark ? '#111827' : '#ffffff'),
      tooltipText: '{category}: {value}' + valueSuffix
    });

    seriesObj.slices.template.adapters.add('fill', (fill, target) => {
      if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.color) {
        return am5.color(target.dataItem.dataContext.color);
      }
      return fill;
    });

    seriesObj.slices.template.adapters.add('stroke', (stroke, target) => {
      if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.color) {
        return am5.color(target.dataItem.dataContext.color);
      }
      return stroke;
    });

    const chartData = data.map((d) => ({
      category: d.name,
      value: d.value,
      color: d.color
    }));

    seriesObj.data.setAll(chartData);

    // Center text if innerRadius > 0 and center text provided
    if (innerRadius > 0 && (centerLabel || centerValue)) {
      const textColorHex = isDark ? '#F3F4F6' : '#1F2937';
      const subTextColorHex = isDark ? '#9CA3AF' : '#6B7280';

      const label = chart.seriesContainer.children.push(
        am5.Label.new(root, {
          textAlign: 'center',
          centerX: am5.p50,
          centerY: am5.p50,
          text: `[fontSize: 12px color: ${subTextColorHex}]${centerLabel}[/]\n[bold fontSize: 18px color: ${textColorHex}]${centerValue}[/]`
        })
      );
    }

    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.p50,
          x: am5.p50,
          marginTop: 15
        })
      );
      legend.data.setAll(seriesObj.dataItems);
    }

    seriesObj.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data, innerRadius, isDark, centerLabel, centerValue, showLegend, valueSuffix]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
