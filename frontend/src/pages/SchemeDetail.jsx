import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { API_BASE_URL } from "../utils/apiConfig";

const SchemeDetail = () => {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const { citizenToken } = useAuth();
  const { success, error } = useNotification();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEligibility, setShowEligibility] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [saveAnswersConsent, setSaveAnswersConsent] = useState(false);
  const [hasSavedAnswers, setHasSavedAnswers] = useState(false);

  useEffect(() => {
    loadSchemeDetails();
    // eslint-disable-next-line
  }, [schemeId]);

  const loadSchemeDetails = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (citizenToken) {
        headers.Authorization = `Bearer ${citizenToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/schemes/${schemeId}`, {
        headers,
      });
      if (!response.ok) throw new Error("Failed to load scheme details");
      const data = await response.json();
      setScheme(data);

      // Check if there are saved answers for pre-fill
      if (data.savedAnswers && Object.keys(data.savedAnswers).length > 0) {
        setHasSavedAnswers(true);
      }
    } catch (err) {
      error(err.message || "Failed to load scheme");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const startEligibilityCheck = () => {
    if (!citizenToken) {
      error("Please login to check eligibility");
      navigate("/login");
      return;
    }
    setShowEligibility(true);
    setCurrentQuestion(0);

    // Pre-fill answers if available
    if (scheme.savedAnswers && Object.keys(scheme.savedAnswers).length > 0) {
      setAnswers(scheme.savedAnswers);
    } else {
      setAnswers({});
    }

    setEligibilityResult(null);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const nextQuestion = () => {
    if (currentQuestion < scheme.eligibilityCriteria.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitEligibilityCheck();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitEligibilityCheck = async () => {
    try {
      setCheckingEligibility(true);
      const response = await fetch(
        `${API_BASE_URL}/api/schemes/${schemeId}/check-eligibility`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${citizenToken}`,
          },
          body: JSON.stringify({
            answers,
            saveToProfile: saveAnswersConsent,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to check eligibility");
      const result = await response.json();
      setEligibilityResult(result);

      if (result.eligible) {
        success("You are eligible for this scheme!");
      }

      if (result.savedToProfile) {
        success("Your answers have been saved for future use!");
      }
    } catch (err) {
      error(err.message || "Failed to check eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const startApplication = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/schemes/${schemeId}/applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${citizenToken}`,
          },
          body: JSON.stringify({
            eligibilityAnswers: answers,
            eligibilityStatus: eligibilityResult.eligibilityStatus,
            eligibilityScore: eligibilityResult.score,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to create application");
      const application = await response.json();
      success("Application started!");
      navigate(`/schemes/${schemeId}/apply/${application.id}`);
    } catch (err) {
      error(err.message || "Failed to start application");
    }
  };

  const renderQuestion = (question) => {
    const answer = answers[question.id];

    switch (question.questionType) {
      case "YES_NO":
        return (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleAnswer(question.id, "YES")}
              className={`w-full p-4 text-left rounded-lg border-2 transition ${
                answer === "YES"
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <span className="font-medium">Yes</span>
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(question.id, "NO")}
              className={`w-full p-4 text-left rounded-lg border-2 transition ${
                answer === "NO"
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <span className="font-medium">No</span>
            </button>
          </div>
        );

      case "SINGLE_CHOICE":
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(question.id, option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                  answer === option
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
        );

      case "NUMBER":
      case "RANGE":
        return (
          <input
            type="number"
            value={answer || ""}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            placeholder="Enter number"
          />
        );

      case "DATE":
        return (
          <input
            type="date"
            value={answer || ""}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
          />
        );

      case "TEXT":
        return (
          <input
            type="text"
            value={answer || ""}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            placeholder="Enter your answer"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading scheme details...</p>
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
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back
        </button>

        {!showEligibility && !eligibilityResult && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Scheme Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <h1 className="text-3xl font-bold mb-2">{scheme.title}</h1>
              <p className="text-blue-100">{scheme.department}</p>
            </div>

            {/* Scheme Content */}
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <div className="prose max-w-none">
                  <ReactMarkdown>{scheme.description}</ReactMarkdown>
                </div>
              </div>

              {scheme.benefits && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Benefits</h2>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{scheme.benefits}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-3">
                  Eligibility Criteria
                </h2>
                <div className="prose max-w-none">
                  <ReactMarkdown>{scheme.eligibility}</ReactMarkdown>
                </div>
              </div>

              {scheme.howToApply && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">How to Apply</h2>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{scheme.howToApply}</ReactMarkdown>
                  </div>
                </div>
              )}

              {scheme.requiredDocuments &&
                scheme.requiredDocuments.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">
                      Required Documents
                    </h2>
                    <ul className="space-y-2">
                      {scheme.requiredDocuments.map((doc) => (
                        <li key={doc.id} className="flex items-start gap-2">
                          <span
                            className={`mt-1 ${doc.isMandatory ? "text-red-500" : "text-gray-500"}`}
                          >
                            {doc.isMandatory ? "●" : "○"}
                          </span>
                          <div>
                            <p className="font-medium">{doc.documentName}</p>
                            {doc.description && (
                              <p className="text-sm text-gray-600">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Formats: {doc.acceptedFormats.join(", ")} | Max
                              size: {doc.maxSizeKB}KB
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {scheme.importantDates && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    Important Dates
                  </h2>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    {scheme.importantDates.startDate && (
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {new Date(
                          scheme.importantDates.startDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {scheme.importantDates.endDate && (
                      <p>
                        <strong>End Date:</strong>{" "}
                        {new Date(
                          scheme.importantDates.endDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {scheme.importantDates.lastDate && (
                      <p>
                        <strong>Last Date to Apply:</strong>{" "}
                        {new Date(
                          scheme.importantDates.lastDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {scheme.contactInfo && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    Contact Information
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {scheme.contactInfo.phone && (
                      <p>
                        <strong>Phone:</strong> {scheme.contactInfo.phone}
                      </p>
                    )}
                    {scheme.contactInfo.email && (
                      <p>
                        <strong>Email:</strong> {scheme.contactInfo.email}
                      </p>
                    )}
                    {scheme.contactInfo.website && (
                      <p>
                        <strong>Website:</strong>{" "}
                        <a
                          href={scheme.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {scheme.contactInfo.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                {scheme.eligibilityCriteria &&
                  scheme.eligibilityCriteria.length > 0 && (
                    <div className="flex-1">
                      <button
                        onClick={startEligibilityCheck}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Check Eligibility & Apply
                      </button>
                      {hasSavedAnswers && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1 justify-center">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Some answers will be pre-filled from your profile
                        </p>
                      )}
                    </div>
                  )}
                {(!scheme.eligibilityCriteria ||
                  scheme.eligibilityCriteria.length === 0) && (
                  <button
                    onClick={() => navigate(`/schemes/${schemeId}/apply`)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Survey */}
        {showEligibility &&
          !eligibilityResult &&
          scheme.eligibilityCriteria && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Eligibility Check</h2>
                  <span className="text-sm text-gray-600">
                    Question {currentQuestion + 1} of{" "}
                    {scheme.eligibilityCriteria.length}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentQuestion + 1) / scheme.eligibilityCriteria.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {scheme.eligibilityCriteria[currentQuestion] && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {scheme.eligibilityCriteria[currentQuestion].questionText}
                      {scheme.eligibilityCriteria[currentQuestion]
                        .isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    {scheme.eligibilityCriteria[currentQuestion].helpText && (
                      <p className="text-sm text-gray-600 mb-4">
                        {scheme.eligibilityCriteria[currentQuestion].helpText}
                      </p>
                    )}
                    {/* Pre-fill indicator */}
                    {hasSavedAnswers &&
                      answers[
                        scheme.eligibilityCriteria[currentQuestion].id
                      ] && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Pre-filled from your saved profile
                          </p>
                        </div>
                      )}
                  </div>

                  {renderQuestion(scheme.eligibilityCriteria[currentQuestion])}

                  {/* Consent checkbox (shown on last question) */}
                  {currentQuestion ===
                    scheme.eligibilityCriteria.length - 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAnswersConsent}
                          onChange={(e) =>
                            setSaveAnswersConsent(e.target.checked)
                          }
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          <strong className="font-semibold">
                            Save my answers for future scheme applications
                          </strong>
                          <p className="text-xs text-gray-600 mt-1">
                            Your responses will be securely stored and used to
                            pre-fill similar questions when you apply to other
                            schemes. This saves you time and effort. You can
                            manage this consent in your profile settings at any
                            time.
                          </p>
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    <button
                      onClick={previousQuestion}
                      disabled={currentQuestion === 0}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={nextQuestion}
                      disabled={
                        !answers[
                          scheme.eligibilityCriteria[currentQuestion].id
                        ] &&
                        scheme.eligibilityCriteria[currentQuestion].isRequired
                      }
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentQuestion < scheme.eligibilityCriteria.length - 1
                        ? "Next"
                        : "Submit"}
                    </button>
                  </div>
                </div>
              )}

              {checkingEligibility && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-center">Checking eligibility...</p>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Eligibility Result */}
        {eligibilityResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                  eligibilityResult.eligible
                    ? "bg-green-100 text-green-600"
                    : eligibilityResult.eligibilityStatus ===
                        "PARTIALLY_ELIGIBLE"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {eligibilityResult.eligible ? (
                  <svg
                    className="w-12 h-12"
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
                ) : (
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {eligibilityResult.eligible
                  ? "You are Eligible!"
                  : eligibilityResult.eligibilityStatus === "PARTIALLY_ELIGIBLE"
                    ? "Partially Eligible"
                    : "Not Eligible"}
              </h2>
              <p className="text-gray-600">{eligibilityResult.message}</p>

              <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">Score:</span>
                <span className="text-lg font-semibold">
                  {eligibilityResult.score} / {eligibilityResult.maxScore}
                </span>
                <span className="text-sm text-gray-600">
                  ({eligibilityResult.percentage}%)
                </span>
              </div>
            </div>

            {eligibilityResult.evaluationResults && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Evaluation Summary</h3>
                <div className="space-y-2">
                  {eligibilityResult.evaluationResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${result.passed ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={
                            result.passed ? "text-green-600" : "text-red-600"
                          }
                        >
                          {result.passed ? "✓" : "✗"}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{result.question}</p>
                          <p className="text-sm text-gray-600">
                            Your answer: {result.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {(eligibilityResult.eligible ||
                eligibilityResult.eligibilityStatus ===
                  "PARTIALLY_ELIGIBLE") && (
                <button
                  onClick={startApplication}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Proceed to Application
                </button>
              )}
              <button
                onClick={() => {
                  setShowEligibility(false);
                  setEligibilityResult(null);
                }}
                className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Back to Scheme Details
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SchemeDetail;
