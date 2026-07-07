import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import type { Test, Question } from '../services/api';

interface TestContextType {
  currentTestId: string | null;
  currentTest: Test | null;
  questions: Question[];
  currentStep: 'details' | 'questions' | 'publish';
  loading: boolean;
  error: string | null;
  setCurrentStep: (step: 'details' | 'questions' | 'publish') => void;
  startNewTest: () => void;
  loadTest: (testId: string) => Promise<void>;
  saveTestDetails: (details: Omit<Test, 'status'>) => Promise<string>;
  addOrUpdateQuestion: (question: Question, index?: number) => void;
  deleteQuestion: (index: number) => void;
  saveQuestionsToServer: () => Promise<void>;
  publishTest: (endConfig?: { status: 'live'; durationDays?: string; endDate?: string; endTime?: string }) => Promise<void>;
  resetContext: () => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState<'details' | 'questions' | 'publish'>('details');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetContext = () => {
    setCurrentTestId(null);
    setCurrentTest(null);
    setQuestions([]);
    setCurrentStep('details');
    setError(null);
  };

  const startNewTest = () => {
    resetContext();
  };

  const loadTest = async (testId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTestById(testId);
      if (response.success && response.data) {
        const testDetails = response.data;
        setCurrentTestId(testDetails.id);
        
        // Map detailed test to Test context model
        const testObj: Test = {
          id: testDetails.id,
          name: testDetails.name,
          type: testDetails.type,
          subject: testDetails.subject,
          topics: testDetails.topics || [],
          sub_topics: testDetails.sub_topics || [],
          correct_marks: testDetails.correct_marks,
          wrong_marks: testDetails.wrong_marks,
          unattempt_marks: testDetails.unattempt_marks,
          difficulty: testDetails.difficulty,
          total_time: testDetails.total_time,
          total_marks: testDetails.total_marks,
          total_questions: testDetails.total_questions,
          status: testDetails.status,
          questions: testDetails.questions || []
        };
        
        setCurrentTest(testObj);
        
        // Fetch questions if there are any
        if (testDetails.questions && testDetails.questions.length > 0) {
          try {
            const qResponse = await api.fetchQuestionsBulk(testDetails.questions);
            if (qResponse.success && qResponse.data) {
              setQuestions(qResponse.data);
            }
          } catch (err) {
            console.error('Error fetching questions for test', err);
            // Don't fail the whole load if questions fail, just set empty questions
            setQuestions([]);
          }
        } else {
          setQuestions([]);
        }
        
        // Decide starting step based on progress
        if (testObj.status === 'live') {
          setCurrentStep('publish');
        } else if (testDetails.questions && testDetails.questions.length > 0) {
          setCurrentStep('questions');
        } else {
          setCurrentStep('details');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load test details.');
    } finally {
      setLoading(false);
    }
  };

  const saveTestDetails = async (details: Omit<Test, 'status'>): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      if (currentTestId) {
        // Edit flow
        const response = await api.updateTest(currentTestId, {
          name: details.name,
          type: details.type,
          subject: details.subject,
          topics: details.topics,
          sub_topics: details.sub_topics,
          correct_marks: details.correct_marks,
          wrong_marks: details.wrong_marks,
          unattempt_marks: details.unattempt_marks,
          difficulty: details.difficulty,
          total_time: details.total_time,
          total_marks: details.total_marks,
          total_questions: details.total_questions
        });
        if (response.success && response.data) {
          const updated = response.data;
          const merged: Test = { ...currentTest, ...updated };
          setCurrentTest(merged);
          setCurrentStep('questions');
          return currentTestId;
        }
        throw new Error(response.message || 'Failed to update test details.');
      } else {
        // Create flow
        const payload: Omit<Test, 'id' | 'created_at'> = {
          ...details,
          status: 'draft'
        };
        const response = await api.createTest(payload);
        if (response.success && response.data) {
          const created = response.data;
          setCurrentTestId(created.id || null);
          setCurrentTest(created);
          setCurrentStep('questions');
          return created.id || '';
        }
        throw new Error(response.message || 'Failed to create test.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save test details';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateQuestion = (question: Question, index?: number) => {
    const updatedQuestions = [...questions];
    if (index !== undefined && index >= 0 && index < questions.length) {
      updatedQuestions[index] = question;
    } else {
      updatedQuestions.push(question);
    }
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const saveQuestionsToServer = async () => {
    if (!currentTestId) {
      throw new Error('No active test selected to save questions for.');
    }
    if (questions.length === 0) {
      throw new Error('At least one question is required.');
    }

    setLoading(true);
    setError(null);
    try {
      // Map questions with test_id
      const questionsWithTestId = questions.map((q) => ({
        ...q,
        test_id: currentTestId,
      }));

      // 1. Bulk create the questions on the server
      const qResponse = await api.createQuestionsBulk(questionsWithTestId);
      if (!qResponse.success || !qResponse.data) {
        throw new Error(qResponse.message || 'Failed to upload questions.');
      }

      // Collect IDs of created questions
      const questionIds = qResponse.data.map((q) => q.id).filter(Boolean) as string[];

      // 2. Update the test with these questions, total questions and total marks
      const calculatedTotalMarks = questions.length * (currentTest?.correct_marks || 1);
      
      const tResponse = await api.updateTest(currentTestId, {
        questions: questionIds,
        total_questions: questions.length,
        total_marks: calculatedTotalMarks,
      });

      if (!tResponse.success) {
        throw new Error(tResponse.message || 'Failed to update test question associations.');
      }

      // Update local state
      setQuestions(qResponse.data);
      if (tResponse.data) {
        setCurrentTest({
          ...currentTest,
          ...tResponse.data,
          questions: questionIds
        });
      }

      setCurrentStep('publish');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save questions';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const publishTest = async (_endConfig?: { status: 'live'; durationDays?: string; endDate?: string; endTime?: string }) => {
    if (!currentTestId) {
      throw new Error('No active test to publish.');
    }
    setLoading(true);
    setError(null);
    try {
      // Config details (like custom duration etc.) can be logged or added to payload if needed, 
      // but according to API docs, publishing is PUT /tests/:id with { "status": "live" }
      const response = await api.updateTest(currentTestId, {
        status: 'live',
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to publish test.');
      }
      
      if (currentTest) {
        setCurrentTest({
          ...currentTest,
          status: 'live',
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to publish test';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TestContext.Provider
      value={{
        currentTestId,
        currentTest,
        questions,
        currentStep,
        loading,
        error,
        setCurrentStep,
        startNewTest,
        loadTest,
        saveTestDetails,
        addOrUpdateQuestion,
        deleteQuestion,
        saveQuestionsToServer,
        publishTest,
        resetContext,
      }}
    >
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};
