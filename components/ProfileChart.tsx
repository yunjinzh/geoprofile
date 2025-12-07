import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProfileLine } from '../types';
import { NeuButton, NeuCard } from './NeuComponents';
import { Sparkles, Trash2, Loader2, MapPin } from 'lucide-react';

interface ProfileChartProps {
  line: ProfileLine;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
}

// Normalize longitude to -180 to 180 range
const normalizeLng = (lng: number): number => {
  return ((lng + 180) % 360 + 360) % 360 - 180;
};

// Helper to format coordinates as DMS (Degrees, Minutes, Seconds)
const toDMS = (val: number, isLat: boolean): string => {
  let normalizedVal = val;
  if (!isLat) {
    normalizedVal = normalizeLng(val);
  }

  const absolute = Math.abs(normalizedVal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLat
    ? normalizedVal >= 0 ? 'N' : 'S'
    : normalizedVal >= 0 ? 'E' : 'W';

  return `${degrees}°${minutes}′${seconds}″${direction}`;
};

// Helper to format decimal coordinates (e.g. -120.45)
const toDecimal = (val: number, isLat: boolean): string => {
  const v = isLat ? val : normalizeLng(val);
  return v.toFixed(4);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const pointData = payload[0].payload;
    const lat = pointData.location?.lat || 0;
    const lng = pointData.location?.lng || 0;

    return (
      <div className="bg-neu-base shadow-neu-out p-3 rounded-lg border border-white/50 text-xs min-w-[200px] z-50">
        <p className="font-bold border-b border-gray-300/50 pb-1 mb-2 text-gray-700">
          距离: {label}m
        </p>
        <div className="space-y-1.5">
          <p className="text-blue-600 font-bold flex justify-between items-center">
            <span>海拔:</span>
            <span>{payload[0].value}m</span>
          </p>
          <div className="pt-1 border-t border-gray-200/50 space-y-1">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-gray-600">
                 <span className="mr-2">经度:</span>
                 <span className="font-mono font-semibold">{toDMS(lng, false)}</span>
              </div>
              <div className="text-right text-[10px] text-gray-400 font-mono">
                ({toDecimal(lng, false)})
              </div>
            </div>
            
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex justify-between items-center text-gray-600">
                <span className="mr-2">纬度:</span>
                <span className="font-mono font-semibold">{toDMS(lat, true)}</span>
              </div>
              <div className="text-right text-[10px] text-gray-400 font-mono">
                ({toDecimal(lat, true)})
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ProfileChart: React.FC<ProfileChartProps> = ({ line, onDelete, onAnalyze }) => {
  // Calculate total distance in km
  const totalDistanceMeters = line.data.length > 0 ? line.data[line.data.length - 1].distance : 0;
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(2);

  return (
    <NeuCard className="mb-6 relative overflow-visible">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full shadow-neu-in" style={{ backgroundColor: line.color }}></div>
          <h4 className="font-bold text-lg text-neu-text">{line.name}</h4>
        </div>
        <div className="flex gap-3">
          <NeuButton 
            onClick={() => onAnalyze(line.id)} 
            disabled={line.isAnalyzing || !!line.analysisResult}
            className="!py-2 !px-4 text-sm"
            icon={line.isAnalyzing ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4" />}
          >
            {line.isAnalyzing ? '分析中...' : line.analysisResult ? '已分析' : '智能分析'}
          </NeuButton>
          <NeuButton onClick={() => onDelete(line.id)} className="!py-2 !px-4 text-sm !text-red-500" icon={<Trash2 className="w-4 h-4"/>}>
            删除
          </NeuButton>
        </div>
      </div>

      <div className="h-[250px] w-full p-2 rounded-xl shadow-neu-in bg-[#e0e5ec]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={line.data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`color-${line.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={line.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#a3b1c6" opacity={0.5} vertical={false} />
            <XAxis 
              dataKey="distance" 
              tick={{fill: '#4a5568', fontSize: 12}} 
              axisLine={false}
              tickLine={false}
              unit="m"
            />
            <YAxis 
              tick={{fill: '#4a5568', fontSize: 12}} 
              axisLine={false} 
              tickLine={false}
              unit="m"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="elevation" 
              stroke={line.color} 
              fillOpacity={1} 
              fill={`url(#color-${line.id})`} 
              strokeWidth={3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Coordinate Info Footer */}
      <div className="mt-5 pt-4 border-t border-gray-300/40 flex flex-col md:flex-row gap-4 justify-between items-center text-sm">
        
        {/* Start Point */}
        <div className="flex items-center gap-3 bg-neu-base p-2 rounded-lg border border-white/40 w-full md:w-auto z-10">
          <div className="p-1.5 rounded-full shadow-neu-btn bg-neu-base text-green-600">
            <MapPin className="w-3 h-3" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-1">起点</span>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-gray-600 font-semibold">
                {toDMS(line.start.lng, false)}, {toDMS(line.start.lat, true)}
              </span>
              <span className="font-mono text-[10px] text-gray-400">
                {toDecimal(line.start.lng, false)}, {toDecimal(line.start.lat, true)}
              </span>
            </div>
          </div>
        </div>

        {/* Distance Line Segment */}
        <div className="relative w-full md:flex-1 h-8 flex items-center justify-center px-4">
          {/* Horizontal Line */}
          <div className="absolute w-[calc(100%-1rem)] md:w-full h-[2px] bg-gray-400/40 top-1/2 transform -translate-y-1/2"></div>
          
          {/* Left Tick */}
          <div className="absolute left-2 md:left-0 h-3 w-[2px] bg-gray-400/60 top-1/2 transform -translate-y-1/2"></div>
          
          {/* Right Tick */}
          <div className="absolute right-2 md:right-0 h-3 w-[2px] bg-gray-400/60 top-1/2 transform -translate-y-1/2"></div>

          {/* Label */}
          <span className="relative z-10 bg-neu-base px-3 py-0.5 text-xs font-bold text-gray-600 shadow-sm rounded-md border border-white/60">
             {totalDistanceKm} km
          </span>
        </div>

        {/* End Point */}
        <div className="flex items-center gap-3 bg-neu-base p-2 rounded-lg border border-white/40 w-full md:w-auto z-10">
          <div className="p-1.5 rounded-full shadow-neu-btn bg-neu-base text-red-500">
            <MapPin className="w-3 h-3" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-1">终点</span>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-gray-600 font-semibold">
                {toDMS(line.end.lng, false)}, {toDMS(line.end.lat, true)}
              </span>
              <span className="font-mono text-[10px] text-gray-400">
                {toDecimal(line.end.lng, false)}, {toDecimal(line.end.lat, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Result */}
      {line.analysisResult && (
        <div className="mt-4 p-4 rounded-xl bg-neu-base shadow-neu-in border-l-4 border-purple-500 animate-fade-in">
          <h5 className="flex items-center gap-2 font-bold text-purple-600 mb-2">
            <Sparkles className="w-4 h-4" /> Gemini 智能分析
          </h5>
          <p className="text-sm text-gray-600 italic leading-relaxed">
            "{line.analysisResult}"
          </p>
        </div>
      )}
    </NeuCard>
  );
};
