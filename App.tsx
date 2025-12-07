import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Mountain, Map as MapIcon, Plus, AlertCircle, MousePointer2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

import { NeuButton } from './components/NeuComponents';
import { MapController } from './components/MapController';
import { ProfileChart } from './components/ProfileChart';
import { Coordinate, DrawingState, ProfileLine, LINE_COLORS } from './types';
import { fetchElevationProfile } from './services/elevationService';

const getAIClient = () => {
  if (process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return null;
};

const App: React.FC = () => {
  const [lines, setLines] = useState<ProfileLine[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>(DrawingState.IDLE);
  const [tempStartPoint, setTempStartPoint] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState(false);
  
  const appRef = useRef<HTMLDivElement>(null);

  const handleMapClick = async (coord: Coordinate) => {
    // No limit on number of lines now
    
    if (drawingState === DrawingState.IDLE) {
      setDrawingState(DrawingState.WAITING_FOR_SECOND_POINT);
      setTempStartPoint(coord);
    } else if (drawingState === DrawingState.WAITING_FOR_SECOND_POINT && tempStartPoint) {
      setLoading(true);
      try {
        const start = tempStartPoint;
        const end = coord;
        
        const data = await fetchElevationProfile(start, end);
        const newLine: ProfileLine = {
          id: Date.now().toString(),
          start: start,
          end: end,
          color: LINE_COLORS[lines.length % LINE_COLORS.length],
          name: `剖面图 ${lines.length + 1}`,
          data: data,
        };
        
        // Add new line
        setLines(prev => {
          const updatedLines = [...prev, newLine];
          return updatedLines;
        });

        // Continuous drawing logic - always continue
        setTempStartPoint(end);
        // State remains WAITING_FOR_SECOND_POINT

      } catch (error) {
        console.error("Failed to fetch elevation", error);
        alert("生成剖面图失败，请重试。");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelDrawing = () => {
    setDrawingState(DrawingState.IDLE);
    setTempStartPoint(null);
  };

  const deleteLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handleExport = async () => {
    if (!appRef.current) return;
    try {
      const canvas = await html2canvas(appRef.current, {
        useCORS: true,
        backgroundColor: '#e0e5ec',
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `terrain-profile-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("导出图片失败，请确保地图瓦片已加载。");
    }
  };

  const analyzeTerrain = async (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return;

    if (!process.env.API_KEY) {
      alert("未配置 API Key，无法进行 AI 分析。");
      return;
    }

    setLines(prev => prev.map(l => l.id === lineId ? { ...l, isAnalyzing: true } : l));

    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI Client not initialized");

      const simplifiedData = line.data
        .filter((_, i) => i % 5 === 0)
        .map(p => `距离:${p.distance}m, 海拔:${p.elevation}m`)
        .join('; ');

      const prompt = `请分析以下地形剖面数据 (距离 vs 海拔) 的地貌特征。
      数据: [${simplifiedData}]。
      请用中文简要描述其物理形态（例如：陡峭的上升、平坦的高原、V型山谷、起伏的丘陵等），限一两句话。`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const analysisText = response.text;

      setLines(prev => prev.map(l => l.id === lineId ? { 
        ...l, 
        isAnalyzing: false, 
        analysisResult: analysisText 
      } : l));

    } catch (error) {
      console.error("Gemini Analysis Failed", error);
      setLines(prev => prev.map(l => l.id === lineId ? { ...l, isAnalyzing: false } : l));
      alert("AI 分析失败，请检查控制台或 API 配额。");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-6xl mx-auto" ref={appRef}>
      
      {/* Header */}
      <header className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-neu-base shadow-neu-out text-neu-text">
            <Mountain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-700">GeoProfile 3D</h1>
            <p className="text-gray-500 text-sm">全球地形剖面图生成工具</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <NeuButton onClick={handleExport} icon={<Download className="w-5 h-5"/>}>
            导出图片
          </NeuButton>
        </div>
      </header>

      {/* Map Section */}
      <section className="h-[500px] w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative h-full w-full bg-neu-base rounded-2xl shadow-neu-out p-2 overflow-hidden border border-white/50">
          <MapController 
            lines={lines} 
            drawingState={drawingState} 
            onMapClick={handleMapClick}
            onMapRightClick={handleCancelDrawing}
            tempStartPoint={tempStartPoint}
          />
          
          {/* Instructions Overlay */}
          <div className="absolute top-4 left-14 z-[400] bg-neu-base/90 backdrop-blur-sm p-4 rounded-xl shadow-neu-out border border-white/40 max-w-xs pointer-events-none">
            <h3 className="font-bold flex items-center gap-2 text-gray-700 mb-1">
              <MapIcon className="w-4 h-4"/>
              使用说明
            </h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
              <li>左键点击：开始/继续绘制线段</li>
              <li>右键点击：完成/取消绘制</li>
              <li>支持无限条连续剖面分析</li>
              <li>使用搜索图标查找地点</li>
            </ul>
          </div>

          {/* Status Indicator */}
          {loading && (
             <div className="absolute inset-0 z-[500] bg-neu-base/50 flex items-center justify-center backdrop-blur-sm rounded-xl">
               <div className="bg-neu-base p-6 rounded-2xl shadow-neu-out flex flex-col items-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mb-2"></div>
                 <span className="font-semibold text-gray-600">正在生成地形数据...</span>
               </div>
             </div>
          )}
        </div>
      </section>

      {/* Profile Charts Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
            <span className="bg-neu-base shadow-neu-out w-8 h-8 rounded-full flex items-center justify-center text-sm">{lines.length}</span>
            地形剖面图列表
          </h2>
          {lines.length === 0 ? (
             <div className="flex items-center gap-2 text-gray-400 text-sm bg-neu-base shadow-neu-in px-4 py-2 rounded-full">
               <AlertCircle className="w-4 h-4" />
               在地图上绘制线段以开始
             </div>
          ) : drawingState === DrawingState.WAITING_FOR_SECOND_POINT ? (
            <div className="flex items-center gap-2 text-blue-500 text-sm bg-neu-base shadow-neu-in px-4 py-2 rounded-full animate-pulse">
               <MousePointer2 className="w-4 h-4" />
               点击下一点或右键结束
             </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {lines.length === 0 ? (
            <div className="h-48 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无剖面图数据</p>
              </div>
            </div>
          ) : (
            lines.map((line) => (
              <ProfileChart 
                key={line.id} 
                line={line} 
                onDelete={deleteLine}
                onAnalyze={analyzeTerrain}
              />
            ))
          )}
        </div>
      </section>

      <footer className="text-center text-gray-400 text-sm py-8">
        &copy; 张云金@GISer学习团
      </footer>
    </div>
  );
};

export default App;