import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTest } from '../contexts/TestContext';
import { api } from '../services/api';
import type { Question, Subject, Topic, SubTopic } from '../services/api';
import { 
  Check, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  AlertCircle,
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  Image
} from 'lucide-react';

export const AddQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { 
    currentTest, 
    questions, 
    loadTest, 
    addOrUpdateQuestion, 
    deleteQuestion, 
    saveQuestionsToServer,
    loading: contextLoading
  } = useTest();

  // Selected Question Index (0-indexed)
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Question Form Fields
  const [questionText, setQuestionText] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [option4, setOption4] = useState('');
  const [correctOption, setCorrectOption] = useState<'option1' | 'option2' | 'option3' | 'option4'>('option1');
  const [explanation, setExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'difficult'>('easy');
  const [qTopic, setQTopic] = useState('');
  const [qSubTopic, setQSubTopic] = useState('');

  // Dropdown Metadata
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);

  // Errors & Toasts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);

  // Load test details if missing
  useEffect(() => {
    if (id && (!currentTest || currentTest.id !== id)) {
      loadTest(id);
    }
  }, [id, currentTest]);

  // Load metadata lists
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const subResponse = await api.getSubjects();
        if (subResponse.success) setSubjectsList(subResponse.data);
        
        if (currentTest?.subject) {
          const topResponse = await api.getTopicsBySubject(currentTest.subject);
          if (topResponse.success) setTopics(topResponse.data);
          
          if (currentTest.topics && currentTest.topics.length > 0) {
            const subtopResponse = await api.getSubTopicsByMultiTopics(currentTest.topics);
            if (subtopResponse.success) setSubTopics(subtopResponse.data);
          }
        }
      } catch (err) {
        console.error('Error fetching metadata', err);
      }
    };
    fetchMetadata();
  }, [currentTest]);

  // Sync Form when activeIndex or questions list changes
  useEffect(() => {
    const currentQ = questions[activeIndex];
    if (currentQ) {
      setQuestionText(currentQ.question || '');
      setOption1(currentQ.option1 || '');
      setOption2(currentQ.option2 || '');
      setOption3(currentQ.option3 || '');
      setOption4(currentQ.option4 || '');
      setCorrectOption(currentQ.correct_option || 'option1');
      setExplanation(currentQ.explanation || '');
      setQDifficulty(currentQ.difficulty || 'easy');
      setQTopic(currentQ.topic_id || '');
      setQSubTopic(currentQ.sub_topic_id || '');
    } else {
      // Load empty form for new question
      setQuestionText('');
      setOption1('');
      setOption2('');
      setOption3('');
      setOption4('');
      setCorrectOption('option1');
      setExplanation('');
      setQDifficulty((currentTest?.difficulty as any) || 'easy');
      setQTopic('');
      setQSubTopic('');
    }
  }, [activeIndex, questions, currentTest]);

  // Auto-save local form details to context when form values change
  const saveLocalFormToContext = () => {
    // Only save if at least something is typed, to avoid creating blank questions
    if (questionText.trim() || option1 || option2 || option3 || option4 || explanation) {
      const qPayload: Question = {
        type: 'mcq',
        question: questionText,
        option1,
        option2,
        option3,
        option4,
        correct_option: correctOption,
        explanation,
        difficulty: qDifficulty,
        topic_id: qTopic || undefined,
        sub_topic_id: qSubTopic || undefined,
        test_id: id
      };
      addOrUpdateQuestion(qPayload, activeIndex);
    }
  };

  // Trigger local save before changing indexes
  const handleIndexChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= (currentTest?.total_questions || 50)) return;
    saveLocalFormToContext();
    setActiveIndex(newIndex);
  };

  const handleClearCurrent = () => {
    setQuestionText('');
    setOption1('');
    setOption2('');
    setOption3('');
    setOption4('');
    setCorrectOption('option1');
    setExplanation('');
    setQDifficulty('easy');
    setQTopic('');
    setQSubTopic('');
    
    // Also remove from context if it exists there
    if (questions[activeIndex]) {
      deleteQuestion(activeIndex);
    }
  };

  const handleSaveAndContinue = async () => {
    saveLocalFormToContext();
    setErrorMsg(null);

    // Verify minimum requirement
    const nonEmptyQuestions = questions.filter(
      (q) => q.question.trim() && q.option1 && q.option2 && q.option3 && q.option4
    );

    if (nonEmptyQuestions.length === 0) {
      setErrorMsg('Please complete at least one MCQ question with all options.');
      return;
    }

    setSaving(true);
    try {
      await saveQuestionsToServer();
      navigate(`/test/${id}/preview`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload questions to server.');
    } finally {
      setSaving(false);
    }
  };

  // Calculations for display
  const totalQCount = currentTest?.total_questions || 50;
  
  // Find subject name
  const subjectName = subjectsList.find(s => s.id === currentTest?.subject)?.name || currentTest?.subject || 'English';

  // Find selected topic names
  const topicNames = currentTest?.topics?.map(tid => topics.find(t => t.id === tid)?.name).filter(Boolean).join(', ') || 'Grammar, Writing';
  const subTopicNames = currentTest?.sub_topics?.map(stid => subTopics.find(st => st.id === stid)?.name).filter(Boolean).join(', ') || 'Application';

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)', margin: '-32px', position: 'relative' }}>
      
      {/* Sidebar - Question Numbers */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Question creation</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Questions</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>{totalQCount}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: totalQCount }).map((_, idx) => {
              const isFilled = questions[idx] && questions[idx].question.trim() && questions[idx].option1;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleIndexChange(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid',
                    borderColor: isActive ? 'var(--primary)' : 'transparent',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isActive || isFilled ? '600' : '500',
                    color: isActive ? 'var(--primary)' : (isFilled ? 'var(--text-dark)' : 'var(--text-muted)')
                  }}>
                    Question {idx + 1}
                  </span>
                  
                  {isFilled && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-main)' }}>
        
        {/* Test details bar */}
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Test Creation</span>
              <span>/</span>
              <span>Create Test</span>
              <span>/</span>
              <span style={{ textTransform: 'capitalize' }}>{currentTest?.type || 'Chapter Wise'}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-type" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {currentTest?.type === 'chapterwise' ? 'Chapter Wise' : currentTest?.type?.toUpperCase() || 'Chapter Wise'}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>
                {currentTest?.name || 'Chapter 1'}
              </h2>
              <span className={`badge badge-${currentTest?.difficulty || 'easy'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                {currentTest?.difficulty || 'Easy'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Subject: <strong style={{ color: 'var(--text-dark)' }}>{subjectName}</strong></span>
              <span>Topic: <strong style={{ color: 'var(--text-dark)' }}>{topicNames}</strong></span>
              <span>Sub Topic: <strong style={{ color: 'var(--text-dark)' }}>{subTopicNames}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              display: 'flex',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-dark)',
              gap: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <span>⏱ {currentTest?.total_time || 60} Min</span>
              <span style={{ borderLeft: '1px solid var(--border)' }} />
              <span>📝 {totalQCount} Q's</span>
              <span style={{ borderLeft: '1px solid var(--border)' }} />
              <span>🏆 {currentTest?.total_marks || 250} Marks</span>
            </div>
            
            <button 
              onClick={() => navigate(`/test/${id}/edit`)}
              className="btn btn-outline"
              style={{ padding: '8px' }}
              title="Edit Test Settings"
            >
              <Edit3 size={16} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {errorMsg && (
            <div style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Question title and format toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>
              Question {activeIndex + 1} <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>/ {totalQCount}</span>
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" style={{ backgroundColor: 'white' }}>+ MCQ</button>
              <button className="btn btn-secondary btn-sm" style={{ backgroundColor: 'white' }}>+ CSV</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              type="button" 
              onClick={handleClearCurrent} 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={14} />
              Delete All Edits
            </button>
          </div>

          {/* Form Content */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Rich Text Editor Simulation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex',
                border: '1px solid var(--border)',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                gap: '16px',
                alignItems: 'center'
              }}>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Bold size={16} /></button>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Italic size={16} /></button>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Underline size={16} /></button>
                <span style={{ borderLeft: '1px solid var(--border)', height: '16px' }} />
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Link size={16} /></button>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><AlignLeft size={16} /></button>
                <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Image size={16} /></button>
              </div>
              <textarea
                className="form-control"
                placeholder="Type question here..."
                style={{
                  borderRadius: '0 0 8px 8px',
                  minHeight: '120px',
                  resize: 'vertical',
                  borderTop: 'none'
                }}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </div>

            {/* Options */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '12px' }}>
                Type the options below
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'option1', label: 'Option A' },
                  { key: 'option2', label: 'Option B' },
                  { key: 'option3', label: 'Option C' },
                  { key: 'option4', label: 'Option D' }
                ].map((opt) => {
                  const isChecked = correctOption === opt.key;
                  const val = opt.key === 'option1' ? option1 : opt.key === 'option2' ? option2 : opt.key === 'option3' ? option3 : option4;
                  const setVal = opt.key === 'option1' ? setOption1 : opt.key === 'option2' ? setOption2 : opt.key === 'option3' ? setOption3 : setOption4;

                  return (
                    <div 
                      key={opt.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOption(opt.key as any)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isChecked ? '5px solid var(--primary)' : '2px solid var(--border)',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.15s'
                        }}
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type Option here"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        style={{ height: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setVal('')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                        title="Clear option text"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation / Add Solution */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>
                Add Solution
              </h4>
              <textarea
                className="form-control"
                placeholder="Type explanation here..."
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            {/* Pagination steppers */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleIndexChange(activeIndex - 1)}
                disabled={activeIndex === 0}
                style={{ padding: '8px 16px' }}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleIndexChange(activeIndex + 1)}
                disabled={activeIndex === totalQCount - 1}
                style={{ padding: '8px 16px' }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Question Settings Override */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '16px' }}>
                Question settings
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                
                {/* Level of Difficulty */}
                <div className="form-group">
                  <label className="form-label">Level of Difficulty</label>
                  <select
                    className="form-control"
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="difficult">Difficult</option>
                  </select>
                </div>

                {/* Topic Override */}
                <div className="form-group">
                  <label className="form-label">Topic</label>
                  <select
                    className="form-control"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                  >
                    <option value="">Select Topic</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subtopic Override */}
                <div className="form-group">
                  <label className="form-label">Sub-topic</label>
                  <select
                    className="form-control"
                    value={qSubTopic}
                    onChange={(e) => setQSubTopic(e.target.value)}
                  >
                    <option value="">Select Sub-topic</option>
                    {subTopics.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

          </div>

          {/* Action buttons footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
            marginTop: '12px'
          }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => navigate('/dashboard')}
              style={{ backgroundColor: '#ffe4e6', color: 'var(--danger)', border: 'none' }}
            >
              Exit Test Creation
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAndContinue}
              disabled={saving || contextLoading}
            >
              {saving ? 'Saving questions...' : 'Save & Continue'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
