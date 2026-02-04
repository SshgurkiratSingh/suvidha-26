import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const ReceiptModal = ({ isOpen, onClose, bill }) => {
  const { t } = useLanguage();

  if (!bill) return null;

  // Simulate a receipt URL
  const receiptUrl = `https://suvidha-city.gov.in/receipts/${bill.id}`;

  const receiptData = JSON.stringify({
    id: bill.id,
    amount: bill.amount,
    date: new Date().toISOString(),
    service: bill.serviceAccount?.department || "UTILITY",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="bg-green-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">Payment Receipt</h2>
              <button
                onClick={onClose}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl shadow-inner border-4 border-dashed border-gray-200 mb-6">
                <QRCodeSVG
                  value={receiptUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
              </div>

              <p className="text-gray-500 mb-2">
                Scan to download digital receipt
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                ₹{bill.amount}
              </h3>
              <p className="text-green-600 font-bold bg-green-50 px-4 py-1 rounded-full mb-6">
                PAID SUCCESSFULLY
              </p>

              <div className="w-full bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono font-bold text-gray-700">
                    {bill.id.slice(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-bold text-gray-700">
                    {bill.serviceAccount?.department}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-bold text-gray-700">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                <Share2 size={20} />
                Share via SMS / Email
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReceiptModal;
