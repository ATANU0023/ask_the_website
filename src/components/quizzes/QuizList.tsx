"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { GenerateQuizDialog } from "./GenerateQuizDialog"

interface QuizQuestion {
  id: string
  question: string
  options: string[] | null
  correctAnswer: string
  explanation: string | null
  questionType: string
}

interface Quiz {
  id: string
  title: string | null
  createdAt: string
  questions: QuizQuestion[]
}

interface QuizListProps {
  quizzes: Quiz[]
  workspaceId: string
}

const optionLabels = ["A", "B", "C", "D"]

export function QuizList({ quizzes, workspaceId }: QuizListProps) {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const quiz = activeQuiz
    ? quizzes.find((q) => q.id === activeQuiz)
    : null

  const score = useMemo(() => {
    if (!quiz || !submitted) return null
    const correct = quiz.questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
    }
  }, [quiz, answers, submitted])

  const currentProgress = useMemo(() => {
    if (!quiz) return 0
    const answered = Object.keys(answers).length
    return (answered / quiz.questions.length) * 100
  }, [quiz, answers])

  function handleSelectAnswer(questionId: string, answer: string) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  function handleSubmit() {
    setSubmitted(true)
  }

  function handleReset() {
    setAnswers({})
    setSubmitted(false)
  }

  // No quizzes state
  if (quizzes.length === 0 && !activeQuiz) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="material-icon text-[32px] text-primary">quiz</span>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">No quizzes yet</h3>
          <p className="text-sm text-on-surface-variant max-w-sm">
            Generate quizzes to test your knowledge
          </p>
        </div>
        <GenerateQuizDialog workspaceId={workspaceId} />
      </div>
    )
  }

  // Quiz list view
  if (!quiz) {
    return (
      <div className="grid gap-4">
        {quizzes.map((q) => (
          <div
            key={q.id}
            className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => {
              setActiveQuiz(q.id)
              setAnswers({})
              setSubmitted(false)
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="material-icon text-[20px] text-primary">quiz</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{q.title || "Untitled Quiz"}</p>
                  <p className="text-xs text-on-surface-variant">{q.questions.length} questions</p>
                </div>
              </div>
              <span className="text-xs text-on-surface-variant">{new Date(q.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Active quiz view
  const currentQuestionIndex = Object.keys(answers).length
  const currentQuestion = quiz.questions[currentQuestionIndex] || quiz.questions[quiz.questions.length - 1]

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Question Column */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
        {/* Quiz Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">{quiz.title || "Quiz"}</h3>
            <p className="text-xs text-on-surface-variant">{quiz.questions.length} questions</p>
          </div>
          <div className="flex gap-2">
            {submitted && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
              >
                <span className="material-icon text-[16px]">refresh</span>
                Retry
              </button>
            )}
            <button
              onClick={() => {
                setActiveQuiz(null)
                setAnswers({})
                setSubmitted(false)
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors"
            >
              <span className="material-icon text-[16px]">close</span>
              Back
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: submitted ? "100%" : `${currentProgress}%` }} />
        </div>

        {submitted ? (
          /* Results View */
          <div className="space-y-4 flex-1 overflow-y-auto">
            {quiz.questions.map((q, idx) => {
              const userAnswer = answers[q.id]
              const isCorrect = userAnswer === q.correctAnswer
              return (
                <div key={q.id} className="glass-card p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium",
                      isCorrect ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                    )}>
                      <span className="material-icon text-[16px]">{isCorrect ? "check" : "close"}</span>
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Your answer: <span className={isCorrect ? "text-green-400" : "text-red-400"}>{userAnswer}</span>
                        {!isCorrect && (
                          <span> · Correct: <span className="text-green-400">{q.correctAnswer}</span></span>
                        )}
                      </p>
                    </div>
                  </div>
                  {q.explanation && (
                    <div className="mt-2 pt-3 border-t border-border/50">
                      <p className="text-xs text-on-surface-variant">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Active Question */
          <div className="glass-card p-6 flex-1">
            {currentQuestion && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-medium text-primary">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {currentQuestion.questionType === "multiple_choice" ? "Multiple Choice" : "True/False"}
                  </span>
                </div>
                <p className="text-base font-medium text-foreground mb-6">{currentQuestion.question}</p>
                <div className="space-y-2">
                  {(currentQuestion.options || ["True", "False"]).map((option, idx) => {
                    const isSelected = answers[currentQuestion.id] === option
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                          isSelected
                            ? "border-primary/50 bg-primary/5 text-foreground"
                            : "border-border/50 bg-surface-container/30 text-on-surface-variant hover:border-primary/30 hover:bg-surface-container/50"
                        )}
                      >
                        <span className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                          isSelected ? "bg-primary/20 text-primary" : "bg-surface-container text-on-surface-variant"
                        )}>
                          {optionLabels[idx] || idx + 1}
                        </span>
                        <span className="text-sm">{option}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => {
                      // Go to previous unanswered
                      const answeredKeys = Object.keys(answers)
                      const prevIdx = answeredKeys.indexOf(currentQuestion.id) - 1
                      if (prevIdx >= 0) {
                        // Remove current answer to go back
                        const newAnswers = { ...answers }
                        delete newAnswers[currentQuestion.id]
                        setAnswers(newAnswers)
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-on-surface-variant hover:text-foreground hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-icon text-[18px]">chevron_left</span>
                    Back
                  </button>

                  {currentQuestionIndex >= quiz.questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      className="rounded-lg px-6 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <span className="text-xs text-on-surface-variant self-center">
                      {quiz.questions.length - currentQuestionIndex - 1} questions remaining
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Widgets */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        {/* Source Document */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icon text-[18px] text-primary">description</span>
            <h3 className="text-sm font-medium text-foreground">Source Document</h3>
          </div>
          <p className="text-xs text-on-surface-variant">
            Questions generated from your uploaded documents
          </p>
        </div>

        {/* Knowledge Graph */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icon text-[18px] text-primary">hub</span>
            <h3 className="text-sm font-medium text-foreground">Knowledge Graph Insight</h3>
          </div>
          <p className="text-xs text-on-surface-variant">
            AI-generated insights connecting concepts from your documents
          </p>
        </div>

        {/* Performance Stats */}
        {score && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icon text-[18px] text-primary">bar_chart</span>
              <h3 className="text-sm font-medium text-foreground">Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Score</span>
                <span className="text-sm font-semibold text-foreground">{score.correct}/{score.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Accuracy</span>
                <span className="text-sm font-semibold text-foreground">{score.percentage}%</span>
              </div>
              <div className="progress-bar mt-1">
                <div className="progress-bar-fill" style={{ width: `${score.percentage}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
