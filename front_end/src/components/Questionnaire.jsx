import { useState } from "react";
import "./Questionnaire.css";

export default function Questionnaire({ onFinish }) {
  const questions = [
    {
      id: "onset",
      question: "When did your pain first begin?",
      type: "radio",
      options: [
        "Within the last hour",
        "Today",
        "1–3 days ago",
        "4–7 days ago",
        "1–4 weeks ago",
        "More than one month ago",
      ],
    },

    {
      id: "trigger",
      question: "What were you doing when the pain began?",
      type: "radio",
      options: [
        "Resting",
        "Walking or exercising",
        "Lifting, bending, or twisting",
        "After a fall or injury",
        "Eating",
        "Sleeping or waking up",
        "I am not sure",
      ],
    },

    {
      id: "spread",
      question: "Does the pain stay in one place or spread elsewhere?",
      type: "radio",
      options: [
        "It stays in one place",
        "It spreads to a nearby area",
        "It travels to another part of my body",
        "I am not sure",
      ],
    },

    {
      id: "trend",
      question: "How has the pain changed since it began?",
      type: "radio",
      options: [
        "It is getting better",
        "It has stayed about the same",
        "It is getting worse",
        "It changes throughout the day",
      ],
    },

    {
      id: "timing",
      question: "Is your pain constant or does it come and go?",
      type: "radio",
      options: ["Constant", "Comes and goes"],
    },

    {
      id: "worse",
      question: "What makes your pain worse?",
      type: "checkbox",
      options: [
        "Walking",
        "Movement",
        "Standing",
        "Sitting",
        "Deep breathing",
        "Eating",
        "Touch",
        "Nothing",
      ],
    },

    {
      id: "better",
      question: "What helps relieve your pain?",
      type: "checkbox",
      options: [
        "Rest",
        "Ice",
        "Heat",
        "Pain medication",
        "Changing position",
        "Stretching",
        "Nothing helps",
      ],
    },

    {
      id: "previous",
      question: "Have you experienced this type of pain before?",
      type: "radio",
      options: ["Yes", "No"],
    },

    {
      id: "impact",
      question: "How much is the pain affecting your daily activities?",
      type: "radio",
      options: ["Not at all", "A little", "Moderately", "Severely"],
    },

    {
      id: "symptoms",
      question: "Are you experiencing any of these symptoms?",
      type: "checkbox",
      options: ["Nausea", "Sweating", "Shortness of breath", "Fever", "None"],
    },
  ];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = questions[current];

  const progress = ((current + 1) / questions.length) * 100;

  function updateAnswer(value) {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }));
  }

  function updateCheckbox(option) {
    const currentValues = answers[question.id] || [];

    if (currentValues.includes(option)) {
      updateAnswer(currentValues.filter((item) => item !== option));
    } else {
      updateAnswer([...currentValues, option]);
    }
  }

  function nextQuestion() {
    const currentAnswer = answers[question.id];

    if (
      currentAnswer === undefined ||
      currentAnswer === null ||
      currentAnswer === ""
    ) {
      alert("Please answer the question before continuing.");
      return;
    }

    if (
      question.type === "checkbox" &&
      (!Array.isArray(currentAnswer) || currentAnswer.length === 0)
    ) {
      alert("Please select at least one option.");
      return;
    }

    if (current === questions.length - 1) {
      console.log("Questionnaire Answers:", answers);

      if (onFinish) {
        onFinish(answers);
      }

      return;
    }

    setCurrent((prev) => prev + 1);
  }

  function previousQuestion() {
    if (current > 0) {
      setCurrent((prev) => prev - 1);
    }
  }

  return (
    <div className="questionnaire-page">
      <div className="grain"></div>

      <div className="questionnaire-card">
        <p className="caption">ADAPTIVE PAIN INTAKE</p>

        <h2>ANATOME</h2>

        <div className="progress">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="question-count">
          Question {current + 1} of {questions.length}
        </p>

        <h1>{question.question}</h1>

        {/* Everything else stays exactly the same */}

        {question.type === "radio" &&
          question.options.map((option) => (
            <button
              key={option}
              className={
                answers[question.id] === option ? "selected option" : "option"
              }
              onClick={() => updateAnswer(option)}
            >
              {option}
            </button>
          ))}

        {question.type === "checkbox" &&
          question.options.map((option) => (
            <button
              key={option}
              className={
                (answers[question.id] || []).includes(option)
                  ? "selected option"
                  : "option"
              }
              onClick={() => updateCheckbox(option)}
            >
              {option}
            </button>
          ))}

        {question.type === "slider" && (
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="10"
              value={answers[question.id] ?? 0}
              onChange={(e) => updateAnswer(Number(e.target.value))}
            />

            <h2>{answers[question.id] ?? 0}/10</h2>

            <div className="slider-labels">
              <span>No Pain</span>
              <span>Worst Pain</span>
            </div>
          </div>
        )}

        <div className="navigation">
          <button
            className="back-button"
            disabled={current === 0}
            onClick={previousQuestion}
          >
            Previous
          </button>

          <button className="next-button" onClick={nextQuestion}>
            {current === questions.length - 1 ? "Finish" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
