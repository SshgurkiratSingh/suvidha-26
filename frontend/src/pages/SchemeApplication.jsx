import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { API_BASE_URL } from "../utils/apiConfig";

const SchemeApplication = () => {
  const { schemeId, applicationId } = useParams();
  const navigate = useNavigate();
  const { citizenToken } = useAuth();
  const { success, error } = useNotification();

  const [scheme, setScheme] = useState(null);
  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [schemeId, applicationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load scheme details
      const schemeRes = await fetch(`${API_BASE_URL}/api/schemes/${schemeId}`);
      if (!schemeRes.ok) throw new Error("Failed to load scheme");
      const schemeData = await schemeRes.json();
      setScheme(schemeData);

      // Load citizen profile
      const profileRes = await fetch(`${API_BASE_URL}/api/schemes/profile/me`, {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        // Pre-fill form with profile data
        setFormData({
          fullName: profileData.fullName || "",
          email: profileData.email || "",
          dateOfBirth: profileData.dateOfBirth
            ? profileData.dateOfBirth.split("T")[0]
            : "",
          gender: profileData.gender || "",
          category: profileData.category || "",
          occupation: profileData.occupation || "",
          monthlyIncome: profileData.monthlyIncome || "",
          aadhaarNumber: profileData.aadhaarNumber || "",
          address: profileData.currentAddress || "",
          district: profileData.district || "",
          state: profileData.state || "",
          pincode: profileData.pincode || "",
          bankAccountNumber: profileData.bankAccountNumber || "",
          bankName: profileData.bankName || "",
          ifscCode: profileData.ifscCode || "",
        });
      }

      // Load existing application if applicationId provided
      if (applicationId) {
        const appRes = await fetch(
          `${API_BASE_URL}/api/schemes/applications/${applicationId}`,
          {
            headers: { Authorization: `Bearer ${citizenToken}` },
          },
        );
        if (appRes.ok) {
          const appData = await appRes.json();
          setApplication(appData);
          if (appData.formData) {
            setFormData({ ...formData, ...appData.formData });
          }
          // Load uploaded documents
          const docs = {};
          appData.documents?.forEach((doc) => {
            docs[doc.documentType] = doc;
          });
          setUploadedDocuments(docs);
        }
      }
    } catch (err) {
      error(err.message || "Failed to load data");
      navigate(`/schemes/${schemeId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const saveProgress = async () => {
    try {
      setSaving(true);

      const url = applicationId
        ? `${API_BASE_URL}/api/schemes/applications/${applicationId}`
        : `${API_BASE_URL}/api/schemes/${schemeId}/applications`;

      const response = await fetch(url, {
        method: applicationId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${citizenToken}`,
        },
        body: JSON.stringify({ formData, status: "DRAFT" }),
      });

      if (!response.ok) throw new Error("Failed to save application");
      const data = await response.json();
      setApplication(data);

      if (!applicationId) {
        navigate(`/schemes/${schemeId}/apply/${data.id}`, { replace: true });
      }

      success("Progress saved");
    } catch (err) {
      error(err.message || "Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!application && !applicationId) {
      error("Please save the form first before uploading documents");
      return;
    }

    try {
      setUploading({ ...uploading, [documentType]: true });

      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("documentType", documentType);
      formDataObj.append("documentName", file.name);

      const appId = applicationId || application.id;
      const response = await fetch(
        `${API_BASE_URL}/api/schemes/applications/${appId}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${citizenToken}`,
          },
          body: formDataObj,
        },
      );

      if (!response.ok) throw new Error("Failed to upload document");
      const document = await response.json();

      setUploadedDocuments({ ...uploadedDocuments, [documentType]: document });
      success(`${file.name} uploaded successfully`);
    } catch (err) {
      error(err.message || "Failed to upload document");
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  const submitApplication = async () => {
    try {
      // Validate required documents
      const requiredDocs =
        scheme.requiredDocuments?.filter((doc) => doc.isMandatory) || [];
      const missingDocs = requiredDocs.filter(
        (doc) => !uploadedDocuments[doc.documentName],
      );

      if (missingDocs.length > 0) {
        error(
          `Please upload: ${missingDocs.map((d) => d.documentName).join(", ")}`,
        );
        return;
      }

      setSaving(true);

      const appId = applicationId || application.id;
      const response = await fetch(
        `${API_BASE_URL}/api/schemes/applications/${appId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${citizenToken}`,
          },
          body: JSON.stringify({ formData, status: "SUBMITTED" }),
        },
      );

      if (!response.ok) throw new Error("Failed to submit application");

      success("Application submitted successfully!");
      navigate("/my-applications");
    } catch (err) {
      error(err.message || "Failed to submit application");
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Personal Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName || ""}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dateOfBirth || ""}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <select
            value={formData.gender || ""}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={formData.category || ""}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
          >
            <option value="">Select Category</option>
            <option value="General">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Aadhaar Number
          </label>
          <input
            type="text"
            value={formData.aadhaarNumber || ""}
            onChange={(e) => handleInputChange("aadhaarNumber", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            placeholder="XXXX-XXXX-XXXX"
            maxLength="12"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Address & Contact</h2>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.address || ""}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            rows="3"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">District</label>
            <input
              type="text"
              value={formData.district || ""}
              onChange={(e) => handleInputChange("district", e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">State</label>
            <input
              type="text"
              value={formData.state || ""}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pincode</label>
            <input
              type="text"
              value={formData.pincode || ""}
              onChange={(e) => handleInputChange("pincode", e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
              maxLength="6"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Occupation</label>
            <input
              type="text"
              value={formData.occupation || ""}
              onChange={(e) => handleInputChange("occupation", e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Monthly Income (₹)
            </label>
            <input
              type="number"
              value={formData.monthlyIncome || ""}
              onChange={(e) =>
                handleInputChange("monthlyIncome", e.target.value)
              }
              className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Bank Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Bank Account Number
          </label>
          <input
            type="text"
            value={formData.bankAccountNumber || ""}
            onChange={(e) =>
              handleInputChange("bankAccountNumber", e.target.value)
            }
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bank Name</label>
          <input
            type="text"
            value={formData.bankName || ""}
            onChange={(e) => handleInputChange("bankName", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">IFSC Code</label>
          <input
            type="text"
            value={formData.ifscCode || ""}
            onChange={(e) => handleInputChange("ifscCode", e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-600 focus:outline-none"
            maxLength="11"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Upload Documents</h2>

      {!scheme.requiredDocuments || scheme.requiredDocuments.length === 0 ? (
        <p className="text-gray-600">No documents required for this scheme.</p>
      ) : (
        <div className="space-y-4">
          {scheme.requiredDocuments.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium">
                    {doc.documentName}
                    {doc.isMandatory && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {doc.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted: {doc.acceptedFormats.join(", ")} | Max:{" "}
                    {doc.maxSizeKB}KB
                  </p>
                </div>
              </div>

              {uploadedDocuments[doc.documentName] ? (
                <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      {uploadedDocuments[doc.documentName].documentName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newDocs = { ...uploadedDocuments };
                      delete newDocs[doc.documentName];
                      setUploadedDocuments(newDocs);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept={doc.acceptedFormats.map((f) => `.${f}`).join(",")}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(doc.documentName, e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id={`file-${doc.id}`}
                  />
                  <label
                    htmlFor={`file-${doc.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                  >
                    {uploading[doc.documentName] ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Choose File
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading application form...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!scheme) return null;

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">
              Apply for {scheme.title}
            </h1>
            <p className="text-gray-600">
              Fill in the details to apply for this scheme
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "Personal Info" },
                { num: 2, label: "Address" },
                { num: 3, label: "Bank Details" },
                { num: 4, label: "Documents" },
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s.num
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {s.num}
                    </div>
                    <span className="text-xs mt-2 text-gray-600">
                      {s.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        step > s.num ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <div className="space-x-2">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
              </div>

              <div className="space-x-2">
                <button
                  onClick={saveProgress}
                  disabled={saving}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Progress"}
                </button>

                {step < 4 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submitApplication}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Submitting..." : "Submit Application"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SchemeApplication;
