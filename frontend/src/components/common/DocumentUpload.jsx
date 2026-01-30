import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { 
  Upload, QrCode, FileText, CheckCircle, 
  ExternalLink, Smartphone, Clock, AlertCircle, Wifi, WifiOff
} from "lucide-react";
import { io } from "socket.io-client";

// Connect with a fallback to ensure the app doesn't crash if server is down
const socket = io("http://10.212.152.190:3001", {
  transports: ["websocket"],
  reconnectionAttempts: 5
}); 

const DocumentUpload = ({ requiredDocuments = ["Aadhaar", "Address Proof"], applicationId, onChange }) => {
  const [method, setMethod] = useState(null); 
  const [uploadStatus, setUploadStatus] = useState({}); 
  const [qrValue, setQrValue] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Initialize status for required docs
  useEffect(() => {
    const initial = {};
    requiredDocuments.forEach(doc => initial[doc] = 'PENDING');
    setUploadStatus(initial);
  }, [requiredDocuments]);

  // Handle Real-Time Socket Connection & Status
  useEffect(() => {
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (applicationId) {
      socket.emit('join_kiosk_room', applicationId);

      socket.on('sync_update', (data) => {
        setUploadStatus(prev => {
          const updated = { ...prev, [data.docType]: data.status };
          onChange(updated);
          return updated;
        });
      });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync_update');
    };
  }, [applicationId, onChange]);

  const handleDigiLockerFetch = () => {
    const newStatus = { ...uploadStatus };
    requiredDocuments.forEach(doc => newStatus[doc] = 'VERIFIED');
    setUploadStatus(newStatus);
    onChange(newStatus);
  };

  const startQrSync = () => {
    setMethod('QR');
    // Pointing to your React Frontend Route we added in App.jsx
    setQrValue(`http://10.212.152.190:3000/sync-upload/${applicationId}`);
  };

  const handleOfflineSubmission = () => {
    const newStatus = {};
    requiredDocuments.forEach(doc => newStatus[doc] = 'PENDING_OFFLINE');
    setUploadStatus(newStatus);
    onChange(newStatus);
    setMethod('CONFIRMATION');
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      PENDING: "bg-gray-100 text-gray-500",
      VERIFIED: "bg-green-100 text-green-700 border border-green-200",
      UPLOADED: "bg-blue-100 text-blue-700",
      PENDING_OFFLINE: "bg-orange-100 text-orange-700"
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[status]}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative">
      {/* SERVER STATUS INDICATOR */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          {isConnected ? 'Sync Online' : 'Sync Offline'}
        </span>
        {isConnected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />}
      </div>

      <h2 className="text-2xl font-bold text-[#0A3D62] mb-6 flex items-center gap-2">
        <Upload className="text-blue-600" /> Document Submission
      </h2>

      {/* Document Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {requiredDocuments.map(doc => (
          <div key={doc} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <FileText className={uploadStatus[doc] === 'PENDING' ? "text-gray-400" : "text-blue-500"} />
              <span className="font-semibold text-gray-700">{doc}</span>
            </div>
            <StatusBadge status={uploadStatus[doc]} />
          </div>
        ))}
      </div>

      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setMethod('DIGILOCKER')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${method === 'DIGILOCKER' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 hover:border-blue-200'}`}>
          <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg"><ExternalLink size={24} /></div>
          <div className="text-center">
            <p className="font-bold text-gray-800">DigiLocker</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Official Fetch</p>
          </div>
        </button>

        <button onClick={startQrSync} disabled={!isConnected} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${!isConnected ? 'opacity-50 cursor-not-allowed' : method === 'QR' ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-gray-100 hover:border-purple-200'}`}>
          <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg"><QrCode size={24} /></div>
          <div className="text-center">
            <p className="font-bold text-gray-800">QR Sync</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Scan & Upload</p>
          </div>
        </button>

        <button onClick={() => setMethod('OFFLINE')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${method === 'OFFLINE' ? 'border-orange-600 bg-orange-50 shadow-md' : 'border-gray-100 hover:border-orange-200'}`}>
          <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg"><Clock size={24} /></div>
          <div className="text-center">
            <p className="font-bold text-gray-800">Offline</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Submit Later</p>
          </div>
        </button>
      </div>

      {/* Action Panels */}
      <AnimatePresence mode="wait">
        {method === 'QR' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 flex flex-col md:flex-row items-center gap-8 p-8 bg-purple-50 rounded-3xl border-2 border-dashed border-purple-200">
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-purple-100">
              <QRCodeSVG value={qrValue} size={160} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-purple-900 mb-2 flex items-center gap-2"><Smartphone size={20}/> Mobile Link Ready</h3>
              <p className="text-purple-700 text-sm mb-4">Scan this code with your phone. Keep this window open while you upload files.</p>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full w-fit text-purple-600 font-bold text-[10px] uppercase shadow-sm">
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
                Waiting for mobile sync...
              </div>
            </div>
          </motion.div>
        )}
        
        {/* ... (Keep DigiLocker and Offline panels same as before) */}
      </AnimatePresence>
    </div>
  );
};

export default DocumentUpload;