import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import ProgressBar from "../../common/ProgressBar";
import DocumentUpload from "../../common/DocumentUpload";
import { generateApplicationNumber } from "../../../utils/generateApplicationNumber";
import { useNotification } from "../../../hooks/useNotification";
import { useKeyboard } from "../../../context/KeyboardContext"; // 1. Import Keyboard Hook
import statesData from "../../../data/states-and-districts.json";

const steps = [
  "Applicant Details",
  "Address Details",
  "Gas Connection Details",
  "Document Upload",
  "Review & Submit",
];

const initialForm = {
  name: "",
  phone: "9876543210",
  aadhaar: "",
  state: "",
  district: "",
  address: "",
  connectionType: "", // LPG / PNG
  usageType: "", // Domestic / Commercial
  cylinderType: "", // only LPG
  documents: {},
};

const GasNewConnection = () => {
  const location = useLocation();
  const notify = useNotification();
  const { openKeyboard } = useKeyboard(); // 2. Destructure openKeyboard

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialForm);
  const [districts, setDistricts] = useState([]);
  const [errors, setErrors] = useState({});
  const [applicationNo, setApplicationNo] = useState(null);
  const [agreed, setAgreed] = useState(false);

  /* ---------- AUTO SELECT LPG / PNG FROM ROUTE ---------- */
  useEffect(() => {
    if (location.pathname.includes("new-lpg")) {
      setFormData((f) => ({ ...f, connectionType: "LPG" }));
    }
    if (location.pathname.includes("new-png")) {
      setFormData((f) => ({ ...f, connectionType: "PNG" }));
    }
  }, [location.pathname]);

  /* ---------- LOAD DRAFT ---------- */
  useEffect(() => {
    const draft = localStorage.getItem("gas_new_connection_draft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setFormData(parsed);
      if (parsed.state) {
        const found = statesData.states.find(
          (s) => s.state === parsed.state
        );
        if (found) setDistricts(found.districts);
      }
    }
  }, []);

  /* ---------- SAVE DRAFT ---------- */
  const saveDraft = () => {
    localStorage.setItem(
      "gas_new_connection_draft",
      JSON.stringify(formData)
    );
    notify.success("Draft saved successfully");
  };

  /* ---------- STATE / DISTRICT ---------- */
  const handleStateChange = (e) => {
    const selected = e.target.value;
    const found = statesData.states.find((s) => s.state === selected);
    setFormData({ ...formData, state: selected, district: "" });
    setDistricts(found ? found.districts : []);
  };

  /* ---------- VALIDATION ---------- */
  const validateStep = () => {
    const e = {};

    if (step === 0) {
      if (!formData.name) e.name = "Name is required";
      if (!formData.aadhaar || formData.aadhaar.length !== 12)
        e.aadhaar = "Valid 12-digit Aadhaar required";
    }

    if (step === 1) {
      if (!formData.state) e.state = "Select state";
      if (!formData.district) e.district = "Select district";
      if (!formData.address) e.address = "Address required";
    }

    if (step === 2) {
      if (!formData.usageType) e.usageType = "Select usage type";
      if (
        formData.connectionType === "LPG" &&
        !formData.cylinderType
      ) {
        e.cylinderType = "Select cylinder type";
      }
    }

    if (step === 3) {
      if (!formData.documents || Object.keys(formData.documents).length === 0) {
        e.documents = "Upload required documents";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------- NAVIGATION ---------- */
  const nextStep = () => {
    if (!validateStep()) return;
    setStep(step + 1);
  };
  const prevStep = () => setStep(step - 1);

  /* ---------- SUBMIT ---------- */
  const handleSubmit = () => {
    if (!agreed) {
      notify.error("Please accept the declaration");
      return;
    }

    const appNo = generateApplicationNumber("GAS");

    localStorage.setItem(
      `gas_application_${appNo}`,
      JSON.stringify({
        ...formData,
        status: "Submitted",
        submittedAt: new Date().toISOString(),
      })
    );

    localStorage.removeItem("gas_new_connection_draft");
    setApplicationNo(appNo);
    notify.success("Gas connection application submitted");
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-[#F4F7FA] py-10">
      <div className="max-w-4xl mx-auto px-6">

        {/* HEADER */}
        <h1 className="text-4xl font-extrabold text-[#8C2F00] mb-2">
          New Gas Connection
        </h1>
        <p className="text-gray-600 mb-8">
          Apply for LPG or PNG gas connection
        </p>

        <ProgressBar steps={steps} currentStep={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg p-8 mt-6"
          >

            {/* STEP 1: Applicant Details */}
            {step === 0 && (
              <>
                <input 
                  name="name" 
                  placeholder="Full Name" 
                  className="gov-input mb-4"
                  value={formData.name} 
                  onChange={handleChange}
                  onFocus={(e) => openKeyboard(e, "text")} // Text Keyboard
                  autoComplete="off"
                />
                <input disabled className="gov-input mb-4 bg-gray-100"
                  value={formData.phone} />
                <input 
                  name="aadhaar" 
                  maxLength={12} 
                  className="gov-input"
                  placeholder="Aadhaar Number"
                  value={formData.aadhaar}
                  onFocus={(e) => openKeyboard(e, "numeric")} // Numeric Keyboard
                  autoComplete="off"
                  onChange={(e) =>
                    /^\d*$/.test(e.target.value) &&
                    setFormData({ ...formData, aadhaar: e.target.value })
                  } 
                />
                {errors.aadhaar && <p className="text-red-500 text-xs mt-1">{errors.aadhaar}</p>}
              </>
            )}

            {/* STEP 2: Address Details */}
            {step === 1 && (
              <>
                <select className="gov-input mb-4"
                  value={formData.state} onChange={handleStateChange}>
                  <option value="">Select State</option>
                  {statesData.states.map(s => (
                    <option key={s.state} value={s.state}>{s.state}</option>
                  ))}
                </select>

                <select className="gov-input mb-4"
                  disabled={!formData.state}
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }>
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <textarea 
                  name="address" 
                  rows="3" 
                  className="gov-input"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={handleChange}
                  onFocus={(e) => openKeyboard(e, "text")} // Text Keyboard
                  autoComplete="off"
                />
              </>
            )}

            {/* STEP 3: Gas Connection Details */}
            {step === 2 && (
              <>
                <input disabled className="gov-input mb-4 bg-gray-100"
                  value={formData.connectionType} />

                <select name="usageType" className="gov-input mb-4"
                  value={formData.usageType} onChange={handleChange}>
                  <option value="">Usage Type</option>
                  <option value="Domestic">Domestic</option>
                  <option value="Commercial">Commercial</option>
                </select>

                {formData.connectionType === "LPG" && (
                  <select name="cylinderType" className="gov-input"
                    value={formData.cylinderType} onChange={handleChange}>
                    <option value="">Cylinder Type</option>
                    <option value="14.2 kg">14.2 kg</option>
                    <option value="5 kg">5 kg</option>
                  </select>
                )}
              </>
            )}

            {/* STEP 4: Documents */}
            {step === 3 && (
              <DocumentUpload
                onChange={(docs) =>
                  setFormData({ ...formData, documents: docs })
                }
              />
            )}

            {/* STEP 5: Review */}
            {step === 4 && !applicationNo && (
              <div className="space-y-3">
                <p><b>Name:</b> {formData.name}</p>
                <p><b>Connection:</b> {formData.connectionType}</p>
                <p><b>Usage:</b> {formData.usageType}</p>
                <p><b>Address:</b> {formData.address}, {formData.district}, {formData.state}</p>

                <label className="flex gap-3 mt-6 items-center cursor-pointer">
                  <input type="checkbox"
                    className="w-5 h-5"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)} />
                  <span className="text-sm text-gray-700">
                    I confirm that the above information is correct.
                  </span>
                </label>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {applicationNo && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-green-700">
                  Application Submitted
                </h2>
                <p className="text-gray-600 mt-2 text-lg">Your Reference Number is:</p>
                <p className="font-mono mt-2 text-2xl bg-gray-100 inline-block px-4 py-2 rounded border border-gray-300">
                  {applicationNo}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {!applicationNo && (
          <div className="flex justify-between mt-8">
            <button 
              onClick={prevStep} 
              disabled={step === 0}
              className={`px-6 py-2 rounded-xl font-bold ${step === 0 ? 'opacity-0' : 'bg-white border hover:bg-gray-50'}`}
            >
              Back
            </button>
            <div className="flex gap-4">
              <button onClick={saveDraft} className="text-gray-500 font-semibold px-4">
                Save Draft
              </button>
              {step < 4 ? (
                <button onClick={nextStep} className="bg-[#8C2F00] text-white px-8 py-2 rounded-xl font-bold shadow-md active:scale-95 transition-all">
                  Next Step
                </button>
              ) : (
                <button onClick={handleSubmit} className="bg-green-600 text-white px-8 py-2 rounded-xl font-bold shadow-md active:scale-95 transition-all">
                  Submit Final
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GasNewConnection;