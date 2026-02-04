import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useNotification } from "../context/NotificationContext";
import { publicAPI } from "../components/services/api";
import { Gift, Filter, ArrowRight, BookOpen } from "lucide-react";

const Schemes = () => {
  const { error } = useNotification();
  const [schemes, setSchemes] = useState([]);
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
    fetchSchemes();
  }, [selectedDepartment]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const data = await publicAPI.getSchemes(
        selectedDepartment === "ALL" ? null : selectedDepartment,
      );
      setSchemes(Array.isArray(data) ? data : data?.schemes || []);
    } catch (err) {
      error(err.message || "Failed to fetch schemes");
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentInfo = (dept) => {
    const info = {
      ELECTRICITY: {
        color: "bg-yellow-100 text-yellow-800",
        borderColor: "border-yellow-200",
      },
      WATER: {
        color: "bg-blue-100 text-blue-800",
        borderColor: "border-blue-200",
      },
      GAS: {
        color: "bg-orange-100 text-orange-800",
        borderColor: "border-orange-200",
      },
      SANITATION: {
        color: "bg-green-100 text-green-800",
        borderColor: "border-green-200",
      },
      MUNICIPAL: {
        color: "bg-purple-100 text-purple-800",
        borderColor: "border-purple-200",
      },
    };
    return (
      info[dept] || {
        color: "bg-gray-100 text-gray-800",
        borderColor: "border-gray-200",
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Gift size={150} />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Government Schemes
              </h1>
              <p className="text-xl text-gray-600">
                Explore benefits, subsidies, and assistance programs available
                for you.
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-full">
              <Gift className="w-16 h-16 text-pink-600" />
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
                      ? "bg-pink-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Schemes List */}
        {loading ? (
          <LoadingSpinner />
        ) : schemes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-md p-10 text-center"
          >
            <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-600 text-2xl">
              No schemes found for the selected department.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {schemes.map((scheme, index) => {
              const style = getDepartmentInfo(scheme.department);
              return (
                <motion.div
                  key={scheme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl shadow-lg border-2 ${style.borderColor} overflow-hidden hover:shadow-2xl transition-all h-full flex flex-col`}
                >
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${style.color}`}
                      >
                        {scheme.department || "General"}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">
                      {scheme.title}
                    </h3>

                    {/* Markdown Description */}
                    <div className="mb-6 prose prose-base text-gray-600 flex-grow">
                      <ReactMarkdown>{scheme.description}</ReactMarkdown>
                    </div>

                    {scheme.eligibility && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                          Eligibility Criteria
                        </h4>
                        <div className="text-sm text-gray-600 prose prose-sm">
                          <ReactMarkdown>{scheme.eligibility}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    <button className="mt-auto w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-colors flex items-center justify-center gap-2 group">
                      Apply Now
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Schemes;
