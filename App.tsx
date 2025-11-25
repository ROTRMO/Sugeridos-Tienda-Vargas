import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryStats } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import InventoryTable from './components/InventoryTable';
import { calculateBalancing } from './services/inventoryLogic';
import { generateInventoryInsights } from './services/geminiService';
import { Settings, BarChart2, Bot, Loader2, Download, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [minStoreStock, setMinStoreStock] = useState<number>(10);
  const [minWarehouseStock, setMinWarehouseStock] = useState<number>(50);
  const [processedData, setProcessedData] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  
  // AI State
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<boolean>(false);

  useEffect(() => {
    if (rawData.length > 0) {
      const { processedItems, stats: newStats } = calculateBalancing(rawData, minStoreStock, minWarehouseStock);
      setProcessedData(processedItems);
      setStats(newStats);
      // Reset AI insights when data changes
      setAiInsights('');
      setAiError(false);
    }
  }, [rawData, minStoreStock, minWarehouseStock]);

  const handleDataLoaded = (data: any[]) => {
    setRawData(data);
  };

  const handleGenerateInsights = async () => {
    if (!stats || processedData.length === 0) return;
    
    setIsAiLoading(true);
    setAiError(false);
    
    // Sort by PO qty desc to find most critical
    const criticalItems = [...processedData]
      .sort((a, b) => b.poQty - a.poQty)
      .slice(0, 5);

    try {
      const insights = await generateInventoryInsights(stats, criticalItems, minStoreStock, minWarehouseStock);
      setAiInsights(insights);
    } catch (e) {
      setAiError(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExport = () => {
      // Simple CSV export logic for the browser
      if (processedData.length === 0) return;
      
      const headers = [
          "Item ID", "Description", "UDS CEDI", "UDS B01", "UDS B06", 
          "Faltante B01", "Faltante B06", "Faltante CEDI", "Trasl CEDI -> B01", "Trasl CEDI -> B06", 
          "Trasl B01 -> B06", "Trasl B06 -> B01", "Sugerido Compra", "Status"
      ];
      
      const rows = processedData.map(item => [
          item.id,
          `"${item.description.replace(/"/g, '""')}"`, // escape quotes
          item.whQty, item.s1Qty, item.s2Qty,
          item.s1Deficit, item.s2Deficit, item.whDeficit,
          item.whToS1, item.whToS2,
          item.s1ToS2, item.s2ToS1,
          item.poQty,
          item.status
      ]);

      const csvContent = [
          headers.join(","),
          ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory_plan_minBodega${minStoreStock}_minCedi${minWarehouseStock}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">InventoryBalancer AI</h1>
          </div>
          
          {stats && (
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Settings className="w-4 h-4 text-gray-500" />
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      Min Bodega:
                      <input 
                        type="number" 
                        min="0" 
                        value={minStoreStock}
                        onChange={(e) => setMinStoreStock(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </label>
                    <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      Min CEDI:
                      <input 
                        type="number" 
                        min="0" 
                        value={minWarehouseStock}
                        onChange={(e) => setMinWarehouseStock(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 px-1 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </label>
                  </div>
               </div>
               
               <button 
                 onClick={handleExport}
                 className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200"
               >
                 <Download className="w-4 h-4" />
                 <span className="hidden sm:inline">Export</span>
               </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!stats ? (
          <div className="max-w-xl mx-auto mt-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Optimize Your Supply Chain</h2>
              <p className="text-gray-500">Upload your inventory Excel sheet to instantly balance stock between your CEDI and Bodegas.</p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* AI Insights Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-indigo-200" />
                  <h3 className="text-lg font-semibold">Gemini AI Analysis</h3>
                </div>
                {!aiInsights && !isAiLoading && (
                  <button 
                    onClick={handleGenerateInsights}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    Generate Report
                  </button>
                )}
              </div>

              {isAiLoading ? (
                <div className="flex items-center gap-3 text-indigo-100 py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing inventory patterns and generating purchasing strategy...</span>
                </div>
              ) : aiInsights ? (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                   {/* Handle newlines for basic formatting */}
                   {aiInsights.split('\n').map((line, i) => (
                     <p key={i} className="mb-1">{line}</p>
                   ))}
                </div>
              ) : (
                <p className="text-indigo-100 text-sm max-w-2xl">
                  Get intelligent suggestions on transfer priorities and purchasing anomalies. 
                  Click "Generate Report" to have AI analyze your {stats.totalItems} SKUs based on Min Bodega ({minStoreStock}) and Min CEDI ({minWarehouseStock}) levels.
                </p>
              )}
              {aiError && (
                 <div className="flex items-center gap-2 text-rose-200 mt-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed to generate insights. Check API Key.</span>
                 </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
               <button 
                 onClick={() => setActiveTab('dashboard')}
                 className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                   activeTab === 'dashboard' 
                     ? 'border-blue-600 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700'
                 }`}
               >
                 Dashboard & Overview
               </button>
               <button 
                 onClick={() => setActiveTab('table')}
                 className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                   activeTab === 'table' 
                     ? 'border-blue-600 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700'
                 }`}
               >
                 Detailed Item List
               </button>
            </div>

            {/* View Content */}
            <div className="animate-in fade-in duration-300">
              {activeTab === 'dashboard' && <Dashboard stats={stats} />}
              {activeTab === 'table' && <InventoryTable items={processedData} />}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;