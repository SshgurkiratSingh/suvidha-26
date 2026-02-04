import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL, SOCKET_URL } from "../utils/apiConfig";
import { Upload, CheckCircle2, ShieldCheck, FileUp } from "lucide-react";
import { motion } from "framer-motion";

// Connect to your Node.js server
const socket = io(SOCKET_URL);

const MobileUploadPortal = () => {
  const { appId } = useParams();
  const [uploading, setUploading] = useState(null); // name of doc being uploaded
  const [completed, setCompleted] = useState([]);

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(docType);

    const formData = new FormData();
    formData.append("file", file);
    // Provide a fallback or metadata if needed
    formData.append("fileUrl", "uploaded_via_mobile");

    try {
      // POST to the public upload endpoint
      await axios.post(
        `${API_BASE_URL}/api/applications/${appId}/upload-public`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      // Tell the Server (Step 1) that this specific doc is done
      socket.emit("document_uploaded", {
        appId: appId,
        docType: docType,
        status: "UPLOADED",
      });

      setCompleted((prev) => [...prev, docType]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-[#0A3D62] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <ShieldCheck className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Suvidha Mobile</h1>
        <p className="text-slate-500 text-sm">Secure Document Upload Portal</p>
        <div className="mt-2 inline-block bg-slate-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-slate-600 uppercase">
          ID: {appId}
        </div>
      </div>

      <div className="space-y-4">
        {["Aadhaar", "Address Proof"].map((doc) => (
          <div
            key={doc}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-700">{doc}</h3>
                <p className="text-xs text-slate-400">
                  JPG, PNG or PDF (Max 5MB)
                </p>
              </div>

              {completed.includes(doc) ? (
                <CheckCircle2 className="text-green-500" size={28} />
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, doc)}
                    disabled={uploading === doc}
                  />
                  <div
                    className={`p-3 rounded-xl transition-all ${uploading === doc ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600 active:scale-90"}`}
                  >
                    {uploading === doc ? (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                    ) : (
                      <FileUp size={24} />
                    )}
                  </div>
                </label>
              )}
            </div>

            {uploading === doc && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                className="h-1 bg-blue-600 rounded-full mt-4"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-blue-600 rounded-3xl text-white shadow-xl text-center">
        <h4 className="font-bold mb-1">Check the Kiosk!</h4>
        <p className="text-sm opacity-90">
          Your documents will appear on the big screen instantly after upload.
        </p>
      </div>
    </div>
  );
};

export default MobileUploadPortal;
