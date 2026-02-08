import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { citizenAPI } from "../components/services/api";
import {
  User,
  Phone,
  Mail,
  Save,
  Edit,
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API_BASE_URL } from "../utils/apiConfig";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAdmin, refreshUser, citizenToken } = useAuth();
  const { success, error } = useNotification();

  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showSavedAnswers, setShowSavedAnswers] = useState(false);

  useEffect(() => {
    if (!user || isAdmin) {
      navigate("/dashboard");
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await citizenAPI.getProfile();
        setForm({
          fullName: profile.fullName || "",
          mobileNumber: profile.mobileNumber || "",
          email: profile.email || "",
        });

        // Load scheme profile data for saved answers
        const response = await fetch(`${API_BASE_URL}/api/schemes/profile/me`, {
          headers: { Authorization: `Bearer ${citizenToken}` },
        });
        if (response.ok) {
          const schemeProfile = await response.json();
          setProfileData(schemeProfile);
        }
      } catch (err) {
        error(err.message || "Failed to load profile");
      }
    };

    loadProfile();
  }, [user, isAdmin, navigate, error]);

  const handleSave = async () => {
    if (!form.fullName && !form.mobileNumber && !form.email) {
      error("Provide at least one field to update");
      return;
    }

    setLoading(true);
    try {
      const updated = await citizenAPI.updateProfile(form);
      setForm({
        fullName: updated.fullName || "",
        mobileNumber: updated.mobileNumber || "",
        email: updated.email || "",
      });

      // Refresh user data in AuthContext
      refreshUser({
        fullName: updated.fullName,
        mobileNumber: updated.mobileNumber,
        email: updated.email,
      });

      success("Profile updated");
    } catch (err) {
      error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const clearSavedAnswers = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all saved answers? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/schemes/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${citizenToken}`,
        },
        body: JSON.stringify({
          savedEligibilityAnswers: {},
        }),
      });

      if (!response.ok) throw new Error("Failed to clear saved answers");

      setProfileData({ ...profileData, savedEligibilityAnswers: {} });
      success("Saved answers cleared");
    } catch (err) {
      error(err.message || "Failed to clear saved answers");
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = async () => {
    try {
      setLoading(true);
      const newConsent = !profileData?.consentToSaveAnswers;

      const response = await fetch(`${API_BASE_URL}/api/schemes/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${citizenToken}`,
        },
        body: JSON.stringify({
          consentToSaveAnswers: newConsent,
        }),
      });

      if (!response.ok) throw new Error("Failed to update consent");

      setProfileData({ ...profileData, consentToSaveAnswers: newConsent });
      success(newConsent ? "Consent enabled" : "Consent disabled");
    } catch (err) {
      error(err.message || "Failed to update consent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-10 border-2 border-gray-100">
          <div className="flex items-center gap-4 mb-10 border-b pb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
              <p className="text-xl text-gray-500">
                Manage your personal information
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <User size={24} className="text-gray-400" /> Full Name
              </label>
              <input
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Phone size={24} className="text-gray-400" /> Mobile Number
              </label>
              <input
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                value={form.mobileNumber}
                onChange={(e) =>
                  setForm({ ...form, mobileNumber: e.target.value })
                }
                placeholder="Enter your mobile number"
              />
            </div>
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Mail size={24} className="text-gray-400" /> Email Address
              </label>
              <input
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter your email address"
              />
            </div>

            <div className="pt-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-5 text-2xl font-bold text-white bg-primary rounded-xl shadow-lg hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="w-8 h-8" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Saved Eligibility Answers Section */}
          <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowSavedAnswers(!showSavedAnswers)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Saved Scheme Answers
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage your saved eligibility survey responses
                  </p>
                </div>
              </div>
              {showSavedAnswers ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {showSavedAnswers && (
              <div className="mt-6 space-y-6">
                {/* Consent Toggle */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Save Answers Automatically
                      </h3>
                      <p className="text-sm text-gray-600">
                        When enabled, your eligibility survey answers are saved
                        and used to pre-fill questions in future scheme
                        applications, saving you time.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData?.consentToSaveAnswers || false}
                        onChange={toggleConsent}
                        disabled={loading}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Saved Answers Display */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Your Saved Answers
                    </h3>
                    {profileData?.savedEligibilityAnswers &&
                      Object.keys(profileData.savedEligibilityAnswers).length >
                        0 && (
                        <button
                          onClick={clearSavedAnswers}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All
                        </button>
                      )}
                  </div>

                  {profileData?.savedEligibilityAnswers &&
                  Object.keys(profileData.savedEligibilityAnswers).length >
                    0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {Object.entries(profileData.savedEligibilityAnswers).map(
                        ([question, data], idx) => (
                          <div
                            key={idx}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            <p className="font-medium text-gray-800 mb-1">
                              {question}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Answer:</span>{" "}
                              {String(data.answer)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Saved:{" "}
                              {new Date(data.savedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No saved answers yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Complete a scheme eligibility check and enable "Save
                        answers" to see them here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
