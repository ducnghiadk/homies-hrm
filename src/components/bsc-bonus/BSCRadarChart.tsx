'use client'

import React from 'react'
import type { BSCCriteriaScore, BSCCriteriaKey } from '@/lib/bsc-types'

interface BSCRadarChartProps {
  scores: BSCCriteriaScore[]
  size?: number
}

export default function BSCRadarChart({ scores, size = 190 }: BSCRadarChartProps) {
  const center = size / 2
  const maxR = center - 25

  // 4 góc tương ứng 4 tiêu chí: 0 (Doanh thu - Top), 90 (Hao hụt - Right), 180 (Vận hành - Bottom), 270 (Khách hàng - Left)
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]

  const getPoint = (angleIndex: number, val: number) => {
    const angle = angles[angleIndex]
    const r = (val / 5) * maxR
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const keysOrder: BSCCriteriaKey[] = ['revenue', 'waste', 'operation', 'customer']
  const scoreMap = new Map(scores.map(s => [s.key, s.converted_score]))

  const currentPoints = keysOrder.map((key, i) => getPoint(i, scoreMap.get(key) || 0))
  const targetPoints = keysOrder.map((_, i) => getPoint(i, 5)) // Max line (5đ)

  const makePolygonPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  const getWeightLabel = (key: BSCCriteriaKey, defaultName: string) => {
    const s = scores.find(item => item.key === key)
    return s ? `${s.name} (${Math.round(s.weight * 100)}%)` : defaultName
  }

  const labels: { key: string; label: string; x: number; y: number; anchor: 'middle' | 'start' | 'end' }[] = [
    { key: 'revenue', label: getWeightLabel('revenue', 'Doanh thu'), x: center, y: center - maxR - 12, anchor: 'middle' },
    { key: 'waste', label: getWeightLabel('waste', 'Hao hụt'), x: center + maxR + 10, y: center + 3, anchor: 'start' },
    { key: 'operation', label: getWeightLabel('operation', 'Vận hành'), x: center, y: center + maxR + 14, anchor: 'middle' },
    { key: 'customer', label: getWeightLabel('customer', 'Khách hàng'), x: center - maxR - 10, y: center + 3, anchor: 'end' },
  ]

  return (
    <div className="relative flex justify-center items-center py-2">
      <svg width={size + 60} height={size + 30} viewBox={`0 0 ${size + 60} ${size + 30}`} className="overflow-visible font-sans text-xs">
        <g transform="translate(30, 15)">
          {/* Circular / Polygon Grid Levels (1 -> 5) */}
          {[1, 2, 3, 4, 5].map(level => {
            const levelPts = keysOrder.map((_, i) => getPoint(i, level))
            return (
              <polygon
                key={level}
                points={levelPts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={level === 5 ? '#CBD5E1' : '#E2E8F0'}
                strokeWidth={level === 5 ? '1.5' : '1'}
                strokeDasharray={level < 5 ? '2 2' : undefined}
              />
            )
          })}

          {/* Axes lines */}
          {keysOrder.map((_, i) => {
            const maxP = getPoint(i, 5)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={maxP.x}
                y2={maxP.y}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            )
          })}

          {/* Polygon fill score */}
          <path
            d={makePolygonPath(currentPoints)}
            fill="rgba(47, 111, 168, 0.25)"
            stroke="#2F6FA8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Data Points Dot */}
          {currentPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#2F6FA8"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Target 5đ polygon outline */}
          <path
            d={makePolygonPath(targetPoints)}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Labels */}
          {labels.map(lbl => (
            <text
              key={lbl.key}
              x={lbl.x}
              y={lbl.y}
              fontSize="10"
              fontWeight="700"
              fill="#1E293B"
              textAnchor={lbl.anchor}
              dominantBaseline="central"
            >
              {lbl.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  )
}
