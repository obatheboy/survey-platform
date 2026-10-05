import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { workApi } from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import {
  TASK_TYPE_META,
  TASK_PAY,
  DAILY_LIMITS,
  VERIFICATION_MODE,
  STATUS_LABELS,
} from "../constants/workTasks";
import "./WorkTasks.css";

export default function WorkTaskSubmit() {
  const { taskId } = useParams();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const loadTask = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setContent("");
    setSelectedOption(null);
    try {
      const res = await workApi.getTask(taskId);
      if (res.data?.success) {
        const t = res.data.task;
        if (t.state !== "available") {
          toast.error("This task is no longer available");
          navigate(`/work/${TASK_TYPE_META[t.type]?.slug || ""}`);
          return;
        }
        setTask(t);
      } else {
        toast.error(res.data?.message || "Task not found");
        navigate("/work");
      }
    } catch (err) {
      console.error("loadTask error:", err);
      toast.error("Could not load task");
      navigate("/work");
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    loadTask();
    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [loadTask]);

  const speakText = () => {
    if (!task?.spokenText) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(task.spokenText);
    u.rate = 0.9;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;
    speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const handleContentChange = (val) => {
    setContent(val);
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleSubmit = async () => {
    if (!task) return;

    if (task.type === "AI_TRAINING") {
      if (selectedOption === null) {
        toast.error("Please select an option");
        return;
      }
    } else {
      if (!content.trim()) {
        toast.error("Please enter your work before submitting");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload =
        task.type === "AI_TRAINING"
          ? { selectedOption }
          : { content: content.trim() };
      const res = await workApi.submitTask(taskId, payload);
      if (res.data?.success) {
        setResult(res.data);
        if (res.data.outcome === "paid") {
          toast.success(`+${format(res.data.pay)} credited!`);
        } else if (res.data.outcome === "review") {
          toast.success("Submitted for review");
        } else {
          toast.error(res.data.message || "Submission failed");
        }
      } else {
        toast.error(res.data?.message || "Submission failed");
      }
    } catch (err) {
      console.error("submitTask error:", err);
      toast.error("Could not submit your work");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextTask = () => {
    navigate(`/work/${TASK_TYPE_META[task.type]?.slug || ""}`);
  };

  if (loading) {
    return (
      <div className="work-page">
        <div className="work-card">
          <div className="work-spinner" />
          <p style={{ textAlign: "center", color: "#6b7280", marginTop: "12px" }}>
            Loading task...
          </p>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const meta = TASK_TYPE_META[task.type];
  const isAi = task.type === "AI_TRAINING";
  const isTranscription = task.type === "TRANSCRIPTION";
  const isWritten = task.type === "ARTICLE" || task.type === "ACADEMIC";
  const limits = isWritten
    ? { min: task.wordLimits?.min || 300, max: task.wordLimits?.max || 600 }
    : null;
  const verificationLabel =
    VERIFICATION_MODE[task.type] === "auto"
      ? "Paid instantly when correct"
      : "Paid after review";

  return (
    <div className="work-page">
      <div className="work-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(`/work/${meta.slug}`)}
          className="work-back-btn"
        >
          ← Back to {meta.label}
        </button>

        <div className="work-task-header">
          <span className="work-task-header-icon">{meta.icon}</span>
          <div>
            <h1 className="work-title" style={{ fontSize: "18px" }}>
              {task.title}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              {task.taskId} • {format(task.pay)} • {verificationLabel}
            </p>
          </div>
        </div>

        {task.brief && (
          <div className="work-brief-box">
            <strong>Brief:</strong> {task.brief}
          </div>
        )}

        {task.instructions && task.instructions.length > 0 && (
          <div className="work-brief-box">
            <strong>Instructions:</strong>
            <ul className="work-instructions">
              {task.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}

        {isAi && (
          <div className="work-ai-section">
            <p className="work-ai-prompt">"{task.prompt}"</p>
            <div className="work-ai-options">
              {task.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={`work-ai-option ${selectedOption === idx ? "selected" : ""}`}
                  onClick={() => setSelectedOption(idx)}
                  disabled={submitting || result}
                >
                  <span className="work-ai-option-label">{opt.label}</span>
                  <span className="work-ai-option-text">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isTranscription && (
          <div className="work-transcription-section">
            <button
              onClick={speakText}
              className="work-play-btn"
              disabled={!task.spokenText}
            >
              {speaking ? "⏹ Stop" : "▶ Play Audio"}
            </button>
            {task.speakerNotes && (
              <p className="work-speaker-notes">{task.speakerNotes}</p>
            )}
            <textarea
              className="work-textarea"
              placeholder="Type what you hear here..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={submitting || result}
              rows={6}
            />
            {limits && (
              <p className="work-word-count">
                {wordCount} words (target: {limits.min}-{limits.max})
              </p>
            )}
          </div>
        )}

        {isWritten && (
          <div className="work-written-section">
            <textarea
              className="work-textarea"
              placeholder={
                task.type === "ACADEMIC"
                  ? "Write your academic piece here..."
                  : "Write your article here..."
              }
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={submitting || result}
              rows={12}
            />
            {limits && (
              <p className="work-word-count">
                {wordCount} words (target: {limits.min}-{limits.max})
                {wordCount > 0 && wordCount < limits.min && (
                  <span className="work-word-warn">
                    {" "}• Too short
                  </span>
                )}
                {wordCount > limits.max && (
                  <span className="work-word-warn">
                    {" "}• Over limit
                  </span>
                )}
              </p>
            )}
            {task.angles && task.angles.length > 0 && (
              <div className="work-angles">
                <strong>Choose an angle:</strong>
                <div className="work-angle-list">
                  {task.angles.map((angle, i) => (
                    <button
                      key={i}
                      className={`work-angle-btn ${content === angle ? "selected" : ""}`}
                      onClick={() => handleContentChange(angle)}
                      disabled={submitting || result}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {task.requiredSections && task.requiredSections.length > 0 && (
              <div className="work-brief-box">
                <strong>Required sections:</strong>
                <ul className="work-instructions">
                  {task.requiredSections.map((sec, i) => (
                    <li key={i}>{sec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!result && (
          <button
            onClick={handleSubmit}
            disabled={submitting || result}
            className="work-submit-btn"
          >
            {submitting ? "Submitting..." : "Submit Work"}
          </button>
        )}

        {result && (
          <div className="work-result-box">
            <h3 className="work-result-title">
              {result.outcome === "paid"
                ? "✅ Paid!"
                : result.outcome === "review"
                ? "⏳ Submitted for Review"
                : "❌ Submission Issue"}
            </h3>
            <p>{result.message}</p>
            {result.outcome === "paid" && (
              <p className="work-result-pay">
                Earned: {format(result.pay || task.pay)}
              </p>
            )}
            {result.autoScore !== null && result.autoScore !== undefined && (
              <p className="work-result-score">
                Match score: {Math.round((result.autoScore || 0) * 100)}%
              </p>
            )}
            {result.explanation && (
              <div className="work-explanation">
                <strong>Explanation:</strong> {result.explanation}
              </div>
            )}
            {result.attemptsLeft !== null && (
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                Attempts left: {result.attemptsLeft}
              </p>
            )}
            <button onClick={handleNextTask} className="work-btn-secondary">
              Next Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
