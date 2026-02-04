import { useState } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { publicAPI } from "../components/services/api";
import { Search, FileText, MessageSquare } from "lucide-react";

const TrackStatus = () => {
  const [type, setType] = useState("application");
  const [id, setId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!id.trim()) return;

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const data =
        type === "application"
          ? await publicAPI.getApplicationStatus(id)
          : await publicAPI.getGrievanceStatus(id);
      setStatus(data.status);
    } catch (err) {
      setError(err.message || "Not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center bg-white p-8 rounded-2xl shadow-sm">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Track Status
            </h1>
            <p className="text-xl text-gray-600">
              Check the status of your applications or grievances instantly
            </p>
          </div>

          <form
            onSubmit={handleTrack}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-8"
          >
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setType("application");
                  setStatus(null);
                  setError(null);
                }}
                className={`flex-1 py-6 text-xl rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                  type === "application"
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <FileText className="w-8 h-8" />
                Application
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("grievance");
                  setStatus(null);
                  setError(null);
                }}
                className={`flex-1 py-6 text-xl rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                  type === "grievance"
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <MessageSquare className="w-8 h-8" />
                Grievance
              </button>
            </div>

            <div>
              <label className="block text-xl font-bold text-gray-700 mb-4 ml-1">
                Enter{" "}
                {type === "application" ? "Application ID" : "Grievance ID"}
              </label>
              <input
                type="text"
                className="w-full px-6 py-5 text-2xl font-mono text-center tracking-widest border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all uppercase placeholder:normal-case placeholder:tracking-normal"
                placeholder={`Enter ${type} ID`}
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-5 text-2xl font-bold text-white bg-primary rounded-xl shadow-lg hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-3"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></span>
              ) : (
                <>
                  <Search className="w-8 h-8" />
                  Track Status
                </>
              )}
            </button>

            {status && (
              <div className="mt-8 p-8 bg-blue-50 border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-lg text-gray-600 mb-2 font-medium uppercase tracking-wide">
                  Current Status
                </p>
                <p className="text-4xl font-extrabold text-primary capitalize py-2 px-6 bg-white object-center rounded-xl shadow-sm border border-blue-100">
                  {status}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-center">
                <p className="text-xl font-bold text-red-600">{error}</p>
              </div>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackStatus;
