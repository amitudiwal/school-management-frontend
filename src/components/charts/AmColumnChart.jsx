import React, { useLayoutEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

export default function AmColumnChart({
  categories = [],
  series = [],
  height = 280,
  stacked = false,
  colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6'],
  valuePrefix = '',
  valueSuffix = '',
  valueFormatter = null
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
        paddingLeft: 10,
        paddingRight: 10
      })
    );

    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {
      behavior: 'none'
    }));
    cursor.lineY.set('visible', false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 30,
          cellStartLocation: 0.1,
          cellEndLocation: 0.9
        }),
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

    const isSingleSeriesDistributed = series.length === 1 && colors.length > 1;

    series.forEach((s, sIdx) => {
      const seriesObj = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: s.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: s.name,
          categoryXField: 'category',
          stacked: stacked,
          tooltip: am5.Tooltip.new(root, {
            labelText: `{name}: ${valuePrefix}{valueY}${valueSuffix}`
          })
        })
      );

      seriesObj.columns.template.setAll({
        cornerRadiusTL: 6,
        cornerRadiusTR: 6,
        strokeOpacity: 0
      });

      if (isSingleSeriesDistributed) {
        seriesObj.columns.template.adapters.add('fill', (fill, target) => {
          const index = seriesObj.columns.indexOf(target);
          return am5.color(colors[index % colors.length]);
        });
        seriesObj.columns.template.adapters.add('stroke', (stroke, target) => {
          const index = seriesObj.columns.indexOf(target);
          return am5.color(colors[index % colors.length]);
        });
      } else {
        const sColor = s.color || colors[sIdx % colors.length];
        seriesObj.set('fill', am5.color(sColor));
        seriesObj.set('stroke', am5.color(sColor));
      }

      seriesObj.data.setAll(chartData);
      seriesObj.appear(1000);
    });

    if (series.length > 1) {
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
  }, [categories, series, isDark, stacked, colors, valuePrefix, valueSuffix]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
