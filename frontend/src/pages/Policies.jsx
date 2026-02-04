import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useNotification } from "../context/NotificationContext";
import { publicAPI } from "../components/services/api";
import { Shield, Filter, ExternalLink } from "lucide-react";

const Policies = () => {
  const { error } = useNotification();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  const departments = [
    "ALL",
    "ELECTRICITY",
    "WATER",
    "GAS",
    "SANITATION",
    "MUNICIPAL",
  ];

  useEffect(() => {
    fetchPolicies();
  }, [selectedDepartment]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await publicAPI.getPolicies(
        selectedDepartment === "ALL" ? null : selectedDepartment,
      );
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      error(err.message || "Failed to fetch policies");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      ELECTRICITY: "bg-yellow-100 text-yellow-800 border-yellow-300",
      WATER: "bg-blue-100 text-blue-800 border-blue-300",
      GAS: "bg-orange-100 text-orange-800 border-orange-300",
      SANITATION: "bg-green-100 text-green-800 border-green-300",
      MUNICIPAL: "bg-purple-100 text-purple-800 border-purple-300",
    };
    return colors[dept] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-white p-8 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Department Policies
              </h1>
              <p className="text-xl text-gray-600">
                View official policies and guidelines for all services
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-full">
              <Shield className="w-16 h-16 text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Department Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter className="w-8 h-8 text-gray-600" />
              <span className="text-xl font-bold text-gray-700 whitespace-nowrap">
                Filter by Department:
              </span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-6 py-4 rounded-xl text-lg font-bold transition-all active:scale-95 ${
                    selectedDepartment === dept
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Policies List */}
        {loading ? (
          <LoadingSpinner />
        ) : policies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-md p-10 text-center"
          >
            <Shield className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-600 text-2xl">
              No policies found for the selected department.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {policies.map((policy, index) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-4 rounded-2xl overflow-hidden hover:shadow-2xl transition-all h-full flex flex-col ${getDepartmentColor(policy.department)}`}
              >
                <div className="p-8 bg-white flex-grow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-800 flex-1 leading-tight">
                      {policy.title}
                    </h3>
                    <div className="ml-4 p-2 bg-gray-50 rounded-full">
                      <Shield
                        className={`w-8 h-8 flex-shrink-0 ${policy.department === "ELECTRICITY" ? "text-yellow-600" : policy.department === "WATER" ? "text-blue-600" : policy.department === "GAS" ? "text-orange-600" : policy.department === "SANITATION" ? "text-green-600" : "text-purple-600"}`}
                      />
                    </div>
                  </div>

                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide mb-6 self-start ${getDepartmentColor(policy.department)}`}
                  >
                    {policy.department}
                  </span>

                  {policy.description && (
                    <div className="text-gray-700 text-lg mb-6 leading-relaxed flex-grow prose prose-blue max-w-none">
                      <ReactMarkdown>{policy.description}</ReactMarkdown>
                    </div>
                  )}

                  <div className="space-y-3 text-base text-gray-600 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    {policy.effectiveFrom && (
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">
                          Effective from:
                        </span>
                        <span className="font-medium">
                          {new Date(policy.effectiveFrom).toLocaleDateString(
                            undefined,
                            { dateStyle: "long" },
                          )}
                        </span>
                      </div>
                    )}

                    {policy.category && (
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">
                          Category:
                        </span>
                        <span className="capitalize px-2 py-0.5 bg-white rounded border border-gray-200">
                          {policy.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {policy.documentUrl && (
                    <a
                      href={policy.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold py-4 rounded-xl transition-all text-lg border-2 border-transparent hover:border-blue-200"
                    >
                      <ExternalLink className="w-6 h-6" />
                      View Full Document
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Policies;
