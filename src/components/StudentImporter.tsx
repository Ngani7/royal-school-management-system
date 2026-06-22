import React, { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import ExcelJS from "exceljs";
import { api } from "../utils/api";

interface StudentData {
  firstName: string;
  lastName: string;
  gender: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export default function StudentImporter({ onClose }: { onClose?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<StudentData[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcelFile = async (file: File): Promise<StudentData[]> => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    const students: StudentData[] = [];

    worksheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const firstName = row.getCell(1).value?.toString().trim() || "";
      const lastName = row.getCell(2).value?.toString().trim() || "";
      const gender = row.getCell(3).value?.toString().trim() || "M";

      if (firstName && lastName) {
        students.push({ firstName, lastName, gender });
      }
    });

    return students;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);

    try {
      if (file.name.endsWith(".xlsx") || file.type.includes("spreadsheet")) {
        const students = await parseExcelFile(file);
        if (students.length === 0) {
          setError("No students found in file");
          return;
        }
        setPreview(students);
      } else {
        setError("Please upload an Excel file (.xlsx)");
      }
    } catch (err) {
      setError(`Error reading file: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  const startImport = async () => {
    if (preview.length === 0) return;

    setIsImporting(true);
    const importResult: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < preview.length; i++) {
      const student = preview[i];

      try {
        await api.post("/api/v1/students", {
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
          dateOfBirth: "2010-01-01",
          schoolLevel: "PRIMARY",
          academicYear: "2026",
          parentGuardianName: "To be assigned",
          parentGuardianPhone: "N/A",
          residentialAddress: "N/A",
        });
        importResult.success++;
      } catch (err) {
        let message = "Unknown error";
        if (err instanceof Error) message = err.message;
        importResult.errors.push({ row: i + 2, message });
        importResult.failed++;
      }
    }

    setIsImporting(false);
    setResult(importResult);
    setPreview([]);
  };

  return (
    <div className="space-y-6">
      {preview.length === 0 && result === null && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
          }`}
        >
          <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop your Excel file here</p>
          <p className="text-xs text-gray-500 mb-4">or click to browse</p>
          <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
            Choose File
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {preview.length > 0 && result === null && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">✅ Found {preview.length} students ready to import</p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">First Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Last Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Gender</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((student, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{student.firstName}</td>
                    <td className="px-4 py-2">{student.lastName}</td>
                    <td className="px-4 py-2">{student.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">... and {preview.length - 10} more</div>}
          </div>

          <div className="flex gap-3">
            <button onClick={startImport} disabled={isImporting} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium flex items-center gap-2">
              {isImporting && <Loader className="h-4 w-4 animate-spin" />}
              {isImporting ? "Importing..." : "Import All"}
            </button>
            <button onClick={() => { setPreview([]); setError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Import Complete!</p>
              <p className="text-sm text-green-800">✅ {result.success} imported • ❌ {result.failed} failed</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <p className="text-sm font-medium text-red-900 mb-3">Errors:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-sm text-red-700">
                    <span className="font-medium">Row {err.row}:</span> {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setPreview([]);
              setError("");
              if (fileInputRef.current) fileInputRef.current.value = "";
              onClose?.();
              window.location.reload(); // ADD THIS LINE
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}