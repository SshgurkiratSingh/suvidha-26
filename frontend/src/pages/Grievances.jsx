import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useNotification } from "../context/NotificationContext";
import { grievancesAPI } from "../components/services/api";
import { MessageSquare, History, CheckCircle } from "lucide-react";
import AIChatBot from "../components/chat/AIChatBot";

const DEPARTMENTS = ["ELECTRICITY", "WATER", "GAS", "SANITATION", "MUNICIPAL"];

const Grievances = () => {
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(false);
  const [grievances, setGrievances] = useState([]);
  const [form, setForm] = useState({
    department: "ELECTRICITY",
    description: "",
  });

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      const data = await grievancesAPI.list();
      setGrievances(data);
    } catch (err) {
      console.error("Failed to fetch grievances", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      error("Please provide a description");
      return;
    }

    setLoading(true);
    try {
      const result = await grievancesAPI.create(form);
      success(`Grievance submitted: ${result.id}`);
      setForm({ department: "ELECTRICITY", description: "" });
      fetchGrievances(); // Refresh list
    } catch (err) {
      error(err.message || "Failed to submit grievance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />
      <AIChatBot />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <MessageSquare className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  Submit Grievance
                </h1>
                <p className="text-xl text-gray-500">
                  Report issues or complaints related to civic services
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-md p-8 space-y-8 border-2 border-gray-100"
          >
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-3">
                Select Department
              </label>
              <select
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white transition-all appearance-none cursor-pointer hover:border-gray-400"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xl font-bold text-gray-700 mb-3">
                Description of Issue *
              </label>
              <textarea
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                rows={6}
                placeholder="Please describe your issue in detail..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>

            <div className="flex gap-6 pt-4">
              <button
                type="button"
                className="px-8 py-4 text-xl font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-8 py-4 text-xl font-bold text-white bg-red-600 rounded-xl shadow-lg hover:bg-red-700 active:scale-95 transition-all"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Grievance Now"}
              </button>
            </div>
          </form>

          {/* Past Grievances List */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <History size={32} /> Your Past Grievances
            </h2>

            {grievances.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="text-gray-400 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700">
                  No Past Grievances
                </h3>
                <p className="text-lg text-gray-500">
                  You haven't submitted any complaints yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {grievances.map((g) => (
                  <div
                    key={g.id}
                    className="bg-white rounded-2xl shadow-md p-8 border-l-8 border-primary hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white bg-primary px-3 py-1 rounded-lg uppercase tracking-wider">
                          {g.department}
                        </span>
                        <h3 className="text-xl font-mono font-bold text-gray-400">
                          #{g.id.slice(-6).toUpperCase()}
                        </h3>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                          g.status === "RESOLVED"
                            ? "bg-green-100 text-green-700"
                            : g.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>
                    <p className="text-gray-800 text-xl font-medium mb-4 leading-relaxed bg-gray-50 p-4 rounded-xl">
                      "{g.description}"
                    </p>
                    <div className="text-base text-gray-500 font-medium flex justify-between items-center border-t border-gray-100 pt-4">
                      <span>
                        Submitted on{" "}
                        {new Date(g.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "long",
                        })}
                      </span>
                      {g.response && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle size={16} /> Response Received
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Grievances;
