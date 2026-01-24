import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { citizenAPI } from "../components/services/api";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAdmin, refreshUser } = useAuth();
  const { success, error } = useNotification();

  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                className="gov-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                className="gov-input"
                value={form.mobileNumber}
                onChange={(e) =>
                  setForm({ ...form, mobileNumber: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                className="gov-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="gov-button-primary w-full disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
