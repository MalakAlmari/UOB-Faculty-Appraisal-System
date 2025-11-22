'use client'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts'


export default function Charts({ rows }:{ rows: Array<{ label:string; total:number; research:number; university:number; community:number; teaching:number }> }){
  // Filter out rows with all zero values and ensure data is properly formatted
  const validRows = rows.filter(row => row.total > 0 || row.research > 0 || row.university > 0 || row.community > 0 || row.teaching > 0)

  // Define colors for the sections
  const sectionColors = {
    research: '#8884d8',
    university: '#82ca9d',
    community: '#ffc658',
    teaching: '#ff7c7c'
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border bg-white p-3">
        <div className="text-sm font-medium mb-2">Total by Cycle</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={validRows} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value.toFixed(2), 'Total Score']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-3">
        <div className="text-sm font-medium mb-2">Section Breakdown (Stacked)</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={validRows} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [value.toFixed(2), name]}
                labelFormatter={(label) => `Cycle: ${label}`}
              />
              <Legend />
              <Bar dataKey="research" stackId="a" fill={sectionColors.research} name="Research" />
              <Bar dataKey="university" stackId="a" fill={sectionColors.university} name="University Service" />
              <Bar dataKey="community" stackId="a" fill={sectionColors.community} name="Community Service" />
              <Bar dataKey="teaching" stackId="a" fill={sectionColors.teaching} name="Teaching Quality" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}