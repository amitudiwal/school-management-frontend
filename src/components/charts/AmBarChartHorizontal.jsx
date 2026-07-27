import React, { useLayoutEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

export default function AmBarChartHorizontal({
  categories = [],
  series = [],
  height = 280,
  colors = ['#6366F1', '#10B981', '#F59E0B', '#14B8A6', '#EC4899', '#3B82F6', '#6B7280'],
  valueSuffix = ' items'
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
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingRight: 20
      })
    );

    const yRenderer = am5xy.AxisRendererY.new(root, {
      inversed: true,
      cellStartLocation: 0.1,
      cellEndLocation: 0.9
    });

    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: yRenderer,
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {})
      })
    );

    const chartData = categories.map((cat, idx) => {
      const item = { category: cat };
      series.forEach((s) => {
        item[s.name] = s.data[idx] ?? 0;
      });
      return item;
    });

    yAxis.data.setAll(chartData);

    series.forEach((s) => {
      const seriesObj = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: s.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueXField: s.name,
          categoryYField: 'category',
          tooltip: am5.Tooltip.new(root, {
            labelText: `{category}: {valueX}${valueSuffix}`
          })
        })
      );

      seriesObj.columns.template.setAll({
        cornerRadiusTR: 4,
        cornerRadiusBR: 4,
        strokeOpacity: 0,
        height: am5.percent(60)
      });

      seriesObj.columns.template.adapters.add('fill', (fill, target) => {
        const index = seriesObj.columns.indexOf(target);
        return am5.color(colors[index % colors.length]);
      });

      seriesObj.columns.template.adapters.add('stroke', (stroke, target) => {
        const index = seriesObj.columns.indexOf(target);
        return am5.color(colors[index % colors.length]);
      });

      seriesObj.data.setAll(chartData);
      seriesObj.appear(1000);
    });

    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [categories, series, isDark, colors, valueSuffix]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
