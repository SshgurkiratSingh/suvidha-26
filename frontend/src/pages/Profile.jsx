import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { citizenAPI } from "../components/services/api";
import { User, Phone, Mail, Save, Edit } from "lucide-react";

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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
