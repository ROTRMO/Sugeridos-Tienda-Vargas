import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON array of arrays to handle columns by index easily
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Map columns: B(1), C(2), N(13), O(14), P(15)
      // Skip header row (index 0)
      const parsedItems = jsonData.slice(1).map((row) => {
        // Ensure row has enough columns
        if (!row[1]) return null; 

        return {
          id: String(row[1] || ''),
          description: String(row[2] || 'Unknown Item'),
          whQty: parseInt(row[13]) || 0, // Col N is index 13
          s1Qty: parseInt(row[14]) || 0, // Col O is index 14
          s2Qty: parseInt(row[15]) || 0, // Col P is index 15
        };
      }).filter(item => item !== null);

      onDataLoaded(parsedItems);
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer text-center group"
    >
      <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Inventory Excel</h3>
      <p className="text-gray-500 mb-6 text-sm max-w-sm">
        Drag and drop your Excel file here, or click to browse. 
        <br/><span className="text-xs text-gray-400">(Required Cols: B=ID, C=Desc, N=WH, O=S1, P=S2)</span>
      </p>
      
      <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
        <Upload className="w-4 h-4" />
        <span>Browse Files</span>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleChange} 
          className="hidden" 
        />
      </label>
    </div>
  );
};

export default FileUpload;
