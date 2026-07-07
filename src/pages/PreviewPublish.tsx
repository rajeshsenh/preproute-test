import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTest } from '../contexts/TestContext';
import { api } from '../services/api';
import type { Subject, Topic, SubTopic } from '../services/api';
import { 
  Check, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  CheckCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const PreviewPublish: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { 
    currentTest, 
    questions, 
    loadTest, 
    publishTest,
    loading: contextLoading 
  } = useTest();

  // Publishing Configuration State
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now');
  const [durationOption, setDurationOption] = useState<string>('always');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // UI state
  const [publishing, setPublishing] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Lists for display lookup
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);

  // Toggle state to preview all questions
  const [previewQuestionsOpen, setPreviewQuestionsOpen] = useState(true);

  // Load Test Details
  useEffect(() => {
    if (id && (!currentTest || currentTest.id !== id)) {
      loadTest(id);
    }
  }, [id, currentTest]);

  // Load Metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const subResponse = await api.getSubjects();
        if (subResponse.success) setSubjects(subResponse.data);

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

  const handlePublish = async () => {
    setErrorMsg(null);
    setPublishing(true);
    try {
      // Setup publish configuration
      const config = {
        status: 'live' as const,
        durationDays: durationOption,
        endDate: durationOption === 'custom' ? endDate : undefined,
        endTime: durationOption === 'custom' ? endTime : undefined
      };
      
      await publishTest(config);
      setSuccessModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish test. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleReturnToDashboard = () => {
    setSuccessModalOpen(false);
    navigate('/dashboard');
  };

  // Label Lookups
  const subjectName = subjects.find(s => s.id === currentTest?.subject)?.name || currentTest?.subject || 'English';
  const topicNames = currentTest?.topics?.map(tid => topics.find(t => t.id === tid)?.name).filter(Boolean).join(', ') || 'Grammar, Writing';
  const subTopicNames = currentTest?.sub_topics?.map(stid => subTopics.find(st => st.id === stid)?.name).filter(Boolean).join(', ') || 'Application';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header and Back button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Test Creation</span>
            <span>/</span>
            <span>Preview & Publish</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-dark)' }}>Test Preview & Publish</h1>
        </div>
        
        <button 
          className="btn btn-outline" 
          onClick={() => navigate(`/test/${id}/questions`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ChevronLeft size={16} />
          Back to questions
        </button>
      </div>

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

      {/* Main card - Test Metadata Banner */}
      <div className="card" style={{ padding: '28px', borderLeft: '6px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-type">{currentTest?.type === 'chapterwise' ? 'Chapter Wise' : currentTest?.type?.toUpperCase() || 'Chapter Wise'}</span>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)' }}>{currentTest?.name || 'Chapter 1'}</h2>
              <span className={`badge badge-${currentTest?.difficulty || 'easy'}`}>{currentTest?.difficulty || 'Easy'}</span>
              
              {currentTest?.status === 'live' && (
                <span className="badge badge-live" style={{ marginLeft: '6px' }}>Live / Published</span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Subject: <strong style={{ color: 'var(--text-dark)' }}>{subjectName}</strong></span>
              <span>Topics: <strong style={{ color: 'var(--text-dark)' }}>{topicNames}</strong></span>
              <span>Sub Topics: <strong style={{ color: 'var(--text-dark)' }}>{subTopicNames}</strong></span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-dark)',
            gap: '16px',
            backgroundColor: '#f8fafc',
            alignItems: 'center',
            height: 'fit-content'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Duration</div>
              <div>⏱ {currentTest?.total_time || 60} Min</div>
            </div>
            <span style={{ borderLeft: '1px solid var(--border)', height: '24px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Questions</div>
              <div>📝 {questions.length} Q's</div>
            </div>
            <span style={{ borderLeft: '1px solid var(--border)', height: '24px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Total Marks</div>
              <div>🏆 {currentTest?.total_marks || 250} Marks</div>
            </div>
          </div>
        </div>

        {/* Dynamic Badge for questions completion */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <Check size={14} strokeWidth={3} />
            <span>All {questions.length} Questions done</span>
          </div>
        </div>
      </div>

      {/* Accordion Questions Preview */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={() => setPreviewQuestionsOpen(!previewQuestionsOpen)}
          style={{
            padding: '18px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: previewQuestionsOpen ? '1px solid var(--border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '15px'
          }}
        >
          <span>Questions Summary ({questions.length})</span>
          <span style={{ fontSize: '12px', color: 'var(--primary)' }}>
            {previewQuestionsOpen ? 'Collapse' : 'Expand Preview'}
          </span>
        </div>

        {previewQuestionsOpen && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto' }}>
            {questions.length === 0 ? (
              <div style={{ padding: '16px', textCombineUpright: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No questions added to this test.
              </div>
            ) : (
              questions.map((q, idx) => (
                <div 
                  key={idx} 
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Question header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Q{idx + 1}</span>
                    <span className="badge badge-easy" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{q.difficulty || 'Easy'}</span>
                  </div>

                  {/* Question prompt */}
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)', marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                    {q.question}
                  </p>

                  {/* MCQ Options grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    {[
                      { key: 'option1', val: q.option1, letter: 'A' },
                      { key: 'option2', val: q.option2, letter: 'B' },
                      { key: 'option3', val: q.option3, letter: 'C' },
                      { key: 'option4', val: q.option4, letter: 'D' }
                    ].map((opt) => {
                      const isCorrect = q.correct_option === opt.key;
                      return (
                        <div 
                          key={opt.key}
                          style={{
                            border: '1px solid',
                            borderColor: isCorrect ? 'var(--success)' : 'var(--border)',
                            backgroundColor: isCorrect ? 'var(--success-light)' : 'transparent',
                            color: isCorrect ? 'var(--success)' : 'var(--text-dark)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            display: 'flex',
                            gap: '8px',
                            fontWeight: isCorrect ? '600' : 'normal'
                          }}
                        >
                          <strong>{opt.letter}.</strong>
                          <span>{opt.val}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderLeft: '3px solid #cbd5e1',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)'
                    }}>
                      <strong>Solution:</strong> {q.explanation}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Publish settings panel */}
      {currentTest?.status !== 'live' && (
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>
              Publishing Options
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Choose whether to publish the test live now or schedule it for a later date.
            </p>
          </div>

          {/* Tab selectors for publishing now vs scheduling */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setPublishType('now')}
              className={`btn ${publishType === 'now' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
            >
              Publish Now
            </button>
            <button
              type="button"
              onClick={() => setPublishType('schedule')}
              className={`btn ${publishType === 'schedule' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
            >
              Schedule Publish
            </button>
          </div>

          {/* Live Until duration settings */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '14px' }}>
              Live Until
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Choose how long this test should remain available on the platform.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {[
                { id: 'always', label: 'Always Available' },
                { id: '3w', label: '3 Weeks' },
                { id: '1w', label: '1 Week' },
                { id: '1m', label: '1 Month' },
                { id: '2w', label: '2 Weeks' },
                { id: 'custom', label: 'Custom Duration' }
              ].map((opt) => (
                <label 
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '1.5px solid',
                    borderColor: durationOption === opt.id ? 'var(--primary)' : 'var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    backgroundColor: durationOption === opt.id ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="duration"
                    checked={durationOption === opt.id}
                    onChange={() => setDurationOption(opt.id)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Duration Date/Time pickers */}
            {durationOption === 'custom' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                padding: '18px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                animation: 'fadeIn 0.2s'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select End Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="date"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select End Time</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="time"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            marginTop: '10px'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={publishing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={publishing || contextLoading || questions.length === 0}
              style={{ minWidth: '130px' }}
            >
              {publishing ? 'Publishing...' : (publishType === 'schedule' ? 'Schedule Publish' : 'Confirm & Publish')}
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', padding: '36px 24px', textAlign: 'center' }}>
            <div style={{
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle size={36} />
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '10px' }}>
              Test Published Successfully!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
              Your test <strong style={{ color: 'var(--text-dark)' }}>"{currentTest?.name}"</strong> with {questions.length} MCQ questions has been made live for students.
            </p>

            <button 
              className="btn btn-primary" 
              onClick={handleReturnToDashboard}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              Return to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
