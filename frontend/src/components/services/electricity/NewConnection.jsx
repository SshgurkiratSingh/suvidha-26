import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "../../common/ProgressBar";
import DocumentUpload from "../../common/DocumentUpload";
import { generateApplicationNumber } from "../../../utils/generateApplicationNumber";
import { useNotification } from "../../../hooks/useNotification";
import { useKeyboard } from "../../../context/KeyboardContext"; 
import statesData from "../../../data/states-and-districts.json";

const steps = [
  "Applicant Details",
  "Address & Property",
  "Connection Details",
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
  propertyType: "",
  load: "",
  phase: "",
  purpose: "",
  documents: {},
};

const NewConnection = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialForm);
  const [districts, setDistricts] = useState([]);
  const [errors, setErrors] = useState({});
  const [applicationNo, setApplicationNo] = useState(null);

  const notify = useNotification();
  const { openKeyboard } = useKeyboard(); 

  useEffect(() => {
    const draft = localStorage.getItem("electricity_new_connection_draft");
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setFormData(parsedDraft);
      if (parsedDraft.state) {
        const found = statesData.states.find((s) => s.state === parsedDraft.state);
        if (found) setDistricts(found.districts);
      }
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem("electricity_new_connection_draft", JSON.stringify(formData));
    notify.success("Draft saved successfully");
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const foundState = statesData.states.find((s) => s.state === selectedState);
    setFormData({ ...formData, state: selectedState, district: "" });
    setDistricts(foundState ? foundState.districts : []);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.name) newErrors.name = "Full name is required";
      if (!formData.aadhaar || formData.aadhaar.length !== 12)
        newErrors.aadhaar = "Valid 12-digit Aadhaar required";
    }
    if (step === 1) {
      if (!formData.state) newErrors.state = "Please select a state";
      if (!formData.district) newErrors.district = "Please select a district";
      if (!formData.address) newErrors.address = "Address is required";
    }
    if (step === 2) {
      if (!formData.load) newErrors.load = "Load (kW) is required";
      if (!formData.phase) newErrors.phase = "Select phase type";
      if (!formData.purpose) newErrors.purpose = "Purpose is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => prev + 1);
  };
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = () => {
    const appNo = generateApplicationNumber("ELEC");
    setApplicationNo(appNo);
    localStorage.removeItem("electricity_new_connection_draft");
    notify.success("Application submitted successfully");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] py-10 pb-[600px]"> 
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="mb-8 text-left">
          <h1 className="text-4xl font-extrabold text-[#0A3D62] font-poppins tracking-tight">
            New Electricity Connection
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Requisition portal for Residential & Commercial Meters
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <ProgressBar steps={steps} currentStep={step} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 min-h-[400px]"
          >
            {/* STEP 1: APPLICANT DETAILS */}
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#0A3D62] border-b pb-4">Applicant Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name (As per Aadhaar)</label>
                    <input 
                      name="name" 
                      className="gov-input" 
                      onChange={handleChange} 
                      onFocus={(e) => openKeyboard(e, 'text')} 
                      value={formData.name} 
                      autoComplete="off"
                      placeholder="e.g. Rajesh Kumar" 
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                    <input disabled className="gov-input bg-gray-50 text-gray-500" value={formData.phone} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhaar Number</label>
                    <input 
                      name="aadhaar" 
                      className="gov-input" 
                      onChange={handleChange} 
                      onFocus={(e) => openKeyboard(e, 'numeric')} 
                      value={formData.aadhaar} 
                      autoComplete="off"
                      placeholder="12 Digit UID" 
                      maxLength={12}
                    />
                    {errors.aadhaar && <p className="text-red-500 text-xs mt-1 font-medium">{errors.aadhaar}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS & PROPERTY */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#0A3D62] border-b pb-4">Address & Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
                    <textarea 
                      name="address" 
                      rows="3" 
                      className="gov-input" 
                      onFocus={(e) => openKeyboard(e, 'text')} 
                      onChange={handleChange} 
                      value={formData.address} 
                      placeholder="House/Flat No, Landmark, Street..." 
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <select className="gov-input" value={formData.state} onChange={handleStateChange}>
                      <option value="">Select State</option>
                      {statesData.states.map((s) => (
                        <option key={s.state} value={s.state}>{s.state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                    <select 
                      className="gov-input" 
                      value={formData.district} 
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      disabled={!formData.state}
                    >
                      <option value="">{formData.state ? "Select District" : "Choose State First"}</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CONNECTION DETAILS */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#0A3D62] border-b pb-4">Connection Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Load (kW)</label>
                    <input 
                      name="load" 
                      className="gov-input" 
                      onFocus={(e) => openKeyboard(e, 'numeric')} 
                      onChange={handleChange} 
                      value={formData.load} 
                      placeholder="0.0"
                    />
                    {errors.load && <p className="text-red-500 text-xs mt-1">{errors.load}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phase</label>
                    <select name="phase" className="gov-input" onChange={handleChange} value={formData.phase}>
                      <option value="">Select Phase</option>
                      <option value="Single Phase">Single Phase</option>
                      <option value="Three Phase">Three Phase</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                    <select name="purpose" className="gov-input" onChange={handleChange} value={formData.purpose}>
                      <option value="">Select Purpose</option>
                      <option value="Domestic">Domestic</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {/* Steps 4 and 5 remain the same as your source */}
          </motion.div>
        </AnimatePresence>

        {!applicationNo && (
          <div className="flex justify-between mt-8">
            <button onClick={prevStep} disabled={step === 0} className={`px-8 py-3 rounded-xl font-bold transition-all ${step === 0 ? 'invisible' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
              Back
            </button>
            <div className="flex gap-4">
              <button onClick={saveDraft} className="text-gray-500 font-semibold px-4 hover:text-[#0A3D62] transition-colors">
                Save Draft
              </button>
              {step < 4 ? (
                <button onClick={nextStep} className="gov-button-primary">Next Step</button>
              ) : (
                <button onClick={handleSubmit} className="gov-button-secondary">Submit Application</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConnection;