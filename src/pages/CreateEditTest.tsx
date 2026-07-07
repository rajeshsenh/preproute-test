import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTest } from '../contexts/TestContext';
import { api } from '../services/api';
import type { Subject, Topic, SubTopic, Test } from '../services/api';
import { ChevronDown, X, AlertCircle } from 'lucide-react';

export const CreateEditTest: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { currentTest, saveTestDetails, loadTest, resetContext } = useTest();

  // API Dropdown Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Form Fields
  const [testType, setTestType] = useState<string>('chapterwise');
  const [subjectId, setSubjectId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'difficult'>('medium');
  const [correctMarks, setCorrectMarks] = useState<number>(4);
  const [wrongMarks, setWrongMarks] = useState<number>(-1);
  const [unattemptMarks, setUnattemptMarks] = useState<number>(0);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [totalMarks, setTotalMarks] = useState<number>(40);

  // Dropdown open states
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [subTopicDropdownOpen, setSubTopicDropdownOpen] = useState(false);

  // Error and Submitting states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Metadata
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.getSubjects();
        if (response.success && response.data) {
          setSubjects(response.data);
        }
      } catch (err) {
        console.error('Error fetching subjects', err);
      }
    };
    fetchSubjects();
  }, []);

  // Load Test details if editing
  useEffect(() => {
    if (id) {
      loadTest(id);
    } else {
      resetContext();
    }
  }, [id]);

  // Sync state if currentTest loads (Edit flow)
  useEffect(() => {
    if (currentTest && id) {
      setName(currentTest.name || '');
      setTestType(currentTest.type || 'chapterwise');
      setSubjectId(currentTest.subject || '');
      setSelectedTopics(currentTest.topics || []);
      setSelectedSubTopics(currentTest.sub_topics || []);
      setDuration(currentTest.total_time || 60);
      setDifficulty(currentTest.difficulty || 'medium');
      setCorrectMarks(currentTest.correct_marks !== undefined ? currentTest.correct_marks : 4);
      setWrongMarks(currentTest.wrong_marks !== undefined ? currentTest.wrong_marks : -1);
      setUnattemptMarks(currentTest.unattempt_marks !== undefined ? currentTest.unattempt_marks : 0);
      setNumQuestions(currentTest.total_questions || 10);
      setTotalMarks(currentTest.total_marks || 40);
    }
  }, [currentTest, id]);

  // Fetch Topics when Subject changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!subjectId) {
        setTopics([]);
        setSelectedTopics([]);
        return;
      }
      setLoadingMetadata(true);
      try {
        const response = await api.getTopicsBySubject(subjectId);
        if (response.success && response.data) {
          setTopics(response.data);
        }
      } catch (err) {
        console.error('Error fetching topics', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchTopics();
  }, [subjectId]);

  // Fetch Subtopics when selected topics change
  useEffect(() => {
    const fetchSubTopics = async () => {
      if (selectedTopics.length === 0) {
        setSubTopics([]);
        setSelectedSubTopics([]);
        return;
      }
      try {
        // Fetch sub-topics using multi-topics POST
        const response = await api.getSubTopicsByMultiTopics(selectedTopics);
        if (response.success && response.data) {
          setSubTopics(response.data);
          
          // Clear subtopics that are no longer valid
          const validSubTopicIds = response.data.map(st => st.id);
          setSelectedSubTopics(prev => prev.filter(id => validSubTopicIds.includes(id)));
        }
      } catch (err) {
        console.error('Error fetching sub-topics', err);
      }
    };

    fetchSubTopics();
  }, [selectedTopics]);

  // Auto calculate total marks
  useEffect(() => {
    setTotalMarks(numQuestions * correctMarks);
  }, [numQuestions, correctMarks]);

  // Handle Multi-Select Toggles
  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSubTopicToggle = (subTopicId: string) => {
    setSelectedSubTopics((prev) =>
      prev.includes(subTopicId)
        ? prev.filter((id) => id !== subTopicId)
        : [...prev, subTopicId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError('Test Name is required.');
      return;
    }
    if (!subjectId) {
      setFormError('Please select a Subject.');
      return;
    }
    if (selectedTopics.length === 0) {
      setFormError('Please select at least one Topic.');
      return;
    }
    if (duration <= 0) {
      setFormError('Duration must be greater than 0.');
      return;
    }
    if (numQuestions <= 0) {
      setFormError('Number of questions must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Omit<Test, 'status'> = {
        name,
        type: testType,
        subject: subjectId,
        topics: selectedTopics,
        sub_topics: selectedSubTopics,
        correct_marks: Number(correctMarks),
        wrong_marks: Number(wrongMarks),
        unattempt_marks: Number(unattemptMarks),
        difficulty,
        total_time: Number(duration),
        total_marks: Number(totalMarks),
        total_questions: Number(numQuestions)
      };

      const testId = await saveTestDetails(payload);
      // Navigate to add questions for this test ID
      navigate(`/test/${testId}/questions`);
    } catch (err: any) {
      setFormError(err.message || 'Error saving test details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Test Creation</span>
          <span>/</span>
          <span>{id ? 'Edit Test' : 'Create Test'}</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-dark)' }}>
          {id ? 'Edit Test details' : 'Create Test details'}
        </h1>
      </div>

      {/* Main card */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {formError && (
            <div style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {/* Test Type selector tabs (Chapterwise, PYQ, Mock Test) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label">Test Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'chapterwise', label: 'Chapter Wise' },
                { id: 'pyq', label: 'PYQ' },
                { id: 'mock', label: 'Mock Test' }
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setTestType(tab.id)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: testType === tab.id ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: testType === tab.id ? 'var(--primary-light)' : 'transparent',
                    color: testType === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* Subject Dropdown */}
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-control"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{ appearance: 'none', backgroundPosition: 'right 14px center', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">Choose from Drop-down</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Test Name */}
            <div className="form-group">
              <label className="form-label">Name of Test</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name of Test"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Topics Multi-Select */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Topic</label>
              <div 
                className="form-control" 
                onClick={() => setTopicDropdownOpen(!topicDropdownOpen)}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '44px',
                  height: 'auto',
                  flexWrap: 'wrap',
                  gap: '6px',
                  paddingRight: '30px'
                }}
              >
                {selectedTopics.length === 0 ? (
                  <span style={{ color: 'var(--text-light)' }}>Choose from Drop-down</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedTopics.map((tid) => {
                      const topicObj = topics.find(t => t.id === tid);
                      return (
                        <span key={tid} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#f1f5f9',
                          color: 'var(--text-dark)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {topicObj ? topicObj.name : tid}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTopicToggle(tid);
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <X size={12} color="var(--text-muted)" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              
              {topicDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 100,
                  marginTop: '4px',
                  padding: '8px'
                }}>
                  {!subjectId ? (
                    <div style={{ padding: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Please select a subject first.
                    </div>
                  ) : loadingMetadata ? (
                    <div style={{ padding: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Loading topics...
                    </div>
                  ) : topics.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      No topics found for this subject.
                    </div>
                  ) : (
                    topics.map((t) => (
                      <label 
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          transition: 'background 0.2s'
                        }}
                        className="dropdown-item-hover"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTopics.includes(t.id)}
                          onChange={() => handleTopicToggle(t.id)}
                          style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                        />
                        <span>{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sub-Topics Multi-Select */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Sub Topic</label>
              <div 
                className="form-control" 
                onClick={() => setSubTopicDropdownOpen(!subTopicDropdownOpen)}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '44px',
                  height: 'auto',
                  flexWrap: 'wrap',
                  gap: '6px',
                  paddingRight: '30px'
                }}
              >
                {selectedSubTopics.length === 0 ? (
                  <span style={{ color: 'var(--text-light)' }}>Choose from Drop-down</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedSubTopics.map((stid) => {
                      const subObj = subTopics.find(st => st.id === stid);
                      return (
                        <span key={stid} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#f1f5f9',
                          color: 'var(--text-dark)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {subObj ? subObj.name : stid}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubTopicToggle(stid);
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <X size={12} color="var(--text-muted)" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {subTopicDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 100,
                  marginTop: '4px',
                  padding: '8px'
                }}>
                  {selectedTopics.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Please select topics first.
                    </div>
                  ) : subTopics.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      No sub-topics found for selected topics.
                    </div>
                  ) : (
                    subTopics.map((st) => (
                      <label 
                        key={st.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          transition: 'background 0.2s'
                        }}
                        className="dropdown-item-hover"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubTopics.includes(st.id)}
                          onChange={() => handleSubTopicToggle(st.id)}
                          style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                        />
                        <span>{st.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Duration (Minutes) */}
            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter duration in minutes"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
              />
            </div>

            {/* Test Difficulty Level */}
            <div className="form-group">
              <label className="form-label">Test Difficulty Level</label>
              <div style={{ display: 'flex', gap: '20px', height: '44px', alignItems: 'center' }}>
                {[
                  { id: 'easy', label: 'Easy' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'difficult', label: 'Difficult' }
                ].map((level) => (
                  <label key={level.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <input
                      type="radio"
                      name="difficulty"
                      checked={difficulty === level.id}
                      onChange={() => setDifficulty(level.id as any)}
                      style={{
                        accentColor: 'var(--primary)',
                        width: '18px',
                        height: '18px'
                      }}
                    />
                    <span>{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Marking Scheme */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '16px' }}>
              Marking Scheme:
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              {/* Correct Marks */}
              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-control"
                    value={correctMarks}
                    onChange={(e) => setCorrectMarks(Number(e.target.value))}
                    style={{ paddingRight: '40px' }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <button type="button" onClick={() => setCorrectMarks(prev => prev + 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>▲</button>
                    <button type="button" onClick={() => setCorrectMarks(prev => Math.max(0, prev - 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>▼</button>
                  </div>
                </div>
              </div>

              {/* Wrong Marks */}
              <div className="form-group">
                <label className="form-label">Wrong Answer</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-control"
                    value={wrongMarks}
                    onChange={(e) => setWrongMarks(Number(e.target.value))}
                    style={{ paddingRight: '40px' }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <button type="button" onClick={() => setWrongMarks(prev => prev + 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>▲</button>
                    <button type="button" onClick={() => setWrongMarks(prev => prev - 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>▼</button>
                  </div>
                </div>
              </div>

              {/* Unattempted Marks */}
              <div className="form-group">
                <label className="form-label">Unattempted</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-control"
                    value={unattemptMarks}
                    onChange={(e) => setUnattemptMarks(Number(e.target.value))}
                    style={{ paddingRight: '40px' }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <button type="button" onClick={() => setUnattemptMarks(prev => prev + 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>▲</button>
                    <button type="button" onClick={() => setUnattemptMarks(prev => prev - 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>▼</button>
                  </div>
                </div>
              </div>

              {/* No of Questions */}
              <div className="form-group">
                <label className="form-label">No of Questions</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ex: 50"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  min={1}
                />
              </div>

              {/* Total Marks */}
              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ex: 250 Marks"
                  value={totalMarks}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
            marginTop: '12px'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving Draft...' : 'Next'}
            </button>
          </div>

        </form>
      </div>

      <style>{`
        .dropdown-item-hover:hover {
          background-color: #f1f5f9;
        }
      `}</style>

    </div>
  );
};
