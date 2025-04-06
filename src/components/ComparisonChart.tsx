import React from 'react';
import { ParentSize } from '@visx/responsive';
import { Group } from '@visx/group';
import { BarGroup } from '@visx/shape';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { GridRows } from '@visx/grid';
import { useTooltip, Tooltip } from '@visx/tooltip';
import { BenchmarkResult } from '../types';

interface ComparisonChartProps {
  data: BenchmarkResult[];
  metric: keyof ModelMetrics;
  title: string;
  formatValue?: (value: number) => string;
  showFolds?: boolean;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  metric,
  title,
  formatValue = (v) => v.toLocaleString(),
  showFolds = false
}) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  const margin = { top: 40, right: 20, bottom: 50, left: 70 };

  return (
    <div className="w-full h-[300px]">
      <ParentSize>
        {({ width, height }) => {
          const xMax = width - margin.left - margin.right;
          const yMax = height - margin.top - margin.bottom;

          const xScale = scaleBand({
            domain: data.map(d => d.modelName),
            range: [0, xMax],
            padding: 0.2,
          });

          const maxValue = Math.max(...data.map(d => {
            if (showFolds && d.metrics.folds && d.metrics.folds[metric]) {
              return Math.max(...d.metrics.folds[metric]);
            }
            return d.metrics[metric];
          }));

          const yScale = scaleLinear({
            domain: [0, maxValue * 1.1],
            range: [yMax, 0],
          });

          return (
            <>
              <svg width={width} height={height}>
                <Group left={margin.left} top={margin.top}>
                  <GridRows
                    scale={yScale}
                    width={xMax}
                    strokeDasharray="3,3"
                    stroke="#e0e0e0"
                  />
                  
                  {data.map((d, i) => {
                    if (showFolds && d.metrics.folds && d.metrics.folds[metric]) {
                      return d.metrics.folds[metric].map((foldValue, foldIndex) => {
                        const barWidth = (xScale.bandwidth() / d.metrics.folds[metric].length) * 0.8;
                        const barHeight = yMax - yScale(foldValue);
                        const barX = (xScale(d.modelName) || 0) + (foldIndex * barWidth);
                        const barY = yMax - barHeight;

                        return (
                          <rect
                            key={`bar-${i}-fold-${foldIndex}`}
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            fill={`rgba(79, 70, 229, ${0.6 + (foldIndex * 0.1)})`}
                            opacity={0.8}
                            onMouseMove={(event) => {
                              const coords = {
                                x: event.clientX,
                                y: event.clientY,
                              };
                              showTooltip({
                                tooltipData: {
                                  model: d.modelName,
                                  fold: foldIndex + 1,
                                  value: formatValue(foldValue),
                                },
                                tooltipLeft: coords.x,
                                tooltipTop: coords.y,
                              });
                            }}
                            onMouseLeave={hideTooltip}
                          />
                        );
                      });
                    } else {
                      const barWidth = xScale.bandwidth();
                      const barHeight = yMax - yScale(d.metrics[metric]);
                      const barX = xScale(d.modelName) || 0;
                      const barY = yMax - barHeight;

                      return (
                        <rect
                          key={`bar-${i}`}
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          fill="#4f46e5"
                          opacity={0.8}
                          onMouseMove={(event) => {
                            const coords = {
                              x: event.clientX,
                              y: event.clientY,
                            };
                            showTooltip({
                              tooltipData: {
                                model: d.modelName,
                                value: formatValue(d.metrics[metric]),
                              },
                              tooltipLeft: coords.x,
                              tooltipTop: coords.y,
                            });
                          }}
                          onMouseLeave={hideTooltip}
                        />
                      );
                    }
                  })}

                  <AxisLeft
                    scale={yScale}
                    tickFormat={formatValue}
                    stroke="#888"
                    tickStroke="#888"
                  />
                  <AxisBottom
                    top={yMax}
                    scale={xScale}
                    stroke="#888"
                    tickStroke="#888"
                    tickLabelProps={{
                      angle: -45,
                      textAnchor: 'end',
                      transform: 'translate(-10, 10)',
                    }}
                  />

                  <text
                    x={-yMax / 2}
                    y={-margin.left + 20}
                    transform="rotate(-90)"
                    textAnchor="middle"
                    className="text-sm fill-gray-600 dark:fill-gray-400"
                  >
                    {title}
                  </text>
                </Group>
              </svg>

              {tooltipOpen && tooltipData && (
                <Tooltip
                  top={tooltipTop}
                  left={tooltipLeft}
                  className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg"
                >
                  <div className="text-sm">
                    <strong>{tooltipData.model}</strong>
                    <br />
                    {tooltipData.fold && `Fold ${tooltipData.fold}`}
                    <br />
                    {title}: {tooltipData.value}
                  </div>
                </Tooltip>
              )}
            </>
          );
        }}
      </ParentSize>
    </div>
  );
};

export default ComparisonChart;