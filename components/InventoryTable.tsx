import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { ChevronLeft, ChevronRight, Search, ArrowRight } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 50;

  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Details</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Item #</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-green-50">Total Sales (3M)</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-gray-100">CEDI</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-gray-100">Bodega 1</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-gray-100">Bodega 6</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-blue-600 bg-blue-50 text-center">Transfer (CEDI)</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-purple-600 bg-purple-50 text-center">Transfer (Bodegas)</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-rose-600 bg-rose-50 text-center">Buy (Min/Max)</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-orange-600 bg-orange-50 text-center">Buy (Sales)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm font-medium text-gray-900">{item.id}</td>
                <td className="p-4 text-sm text-gray-600">{item.description}</td>
                <td className="p-4 text-sm text-center font-bold text-green-700 bg-green-50/30">{item.total3MonthSales}</td>
                
                <td className="p-4 text-sm text-center font-mono bg-gray-50/50">{item.whQty}</td>
                <td className="p-4 text-sm text-center font-mono bg-gray-50/50">
                  <span className={item.s1Qty < 5 ? "text-amber-600 font-bold" : ""}>{item.s1Qty}</span>
                </td>
                <td className="p-4 text-sm text-center font-mono bg-gray-50/50">
                   <span className={item.s2Qty < 5 ? "text-amber-600 font-bold" : ""}>{item.s2Qty}</span>
                </td>
                
                {/* Actions: WH Transfers */}
                <td className="p-4 text-sm text-center bg-blue-50/30">
                  {(item.whToS1 > 0 || item.whToS2 > 0) ? (
                    <div className="flex flex-col gap-1 items-center">
                       {item.whToS1 > 0 && <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">To B1: {item.whToS1}</span>}
                       {item.whToS2 > 0 && <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">To B6: {item.whToS2}</span>}
                    </div>
                  ) : <span className="text-gray-300">-</span>}
                </td>

                {/* Actions: Lateral Transfers */}
                <td className="p-4 text-sm text-center bg-purple-50/30">
                   {(item.s1ToS2 > 0 || item.s2ToS1 > 0) ? (
                    <div className="flex items-center justify-center gap-1">
                       {item.s1ToS2 > 0 && (
                         <div className="flex items-center text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                           B1 <ArrowRight className="w-3 h-3 mx-1"/> B6: <strong>{item.s1ToS2}</strong>
                         </div>
                       )}
                       {item.s2ToS1 > 0 && (
                         <div className="flex items-center text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                           B6 <ArrowRight className="w-3 h-3 mx-1"/> B1: <strong>{item.s2ToS1}</strong>
                         </div>
                       )}
                    </div>
                  ) : <span className="text-gray-300">-</span>}
                </td>

                {/* Actions: PO Min/Max */}
                <td className="p-4 text-sm text-center font-bold bg-rose-50/30">
                  {item.poQty > 0 ? (
                    <span className="text-rose-600">+{item.poQty}</span>
                  ) : <span className="text-gray-300">-</span>}
                </td>

                 {/* Actions: PO Sales */}
                <td className="p-4 text-sm text-center font-bold bg-orange-50/30">
                  {item.poBySales > 0 ? (
                    <span className="text-orange-600">+{item.poBySales}</span>
                  ) : <span className="text-gray-300">-</span>}
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-gray-500">
                  No items found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages} ({filteredItems.length} items)
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;