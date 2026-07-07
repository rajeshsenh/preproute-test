import axios from 'axios';

const API_BASE_URL = 'https://admin-moderator-backend-staging.up.railway.app/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to request headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('preproute_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
}

export interface Question {
  id?: string;
  type: 'mcq';
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 'option1' | 'option2' | 'option3' | 'option4';
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'difficult';
  test_id?: string;
  topic_id?: string;
  sub_topic_id?: string;
  created_at?: string;
}

export interface Test {
  id?: string;
  name: string;
  type: string; // 'chapterwise' | 'pyq' | 'mock'
  subject: string; // subject UUID
  topics: string[]; // array of topic UUIDs
  sub_topics: string[]; // array of subtopic UUIDs
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: 'easy' | 'medium' | 'difficult';
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: 'draft' | 'live' | null;
  questions?: string[]; // array of question UUIDs
  created_at?: string;
}

export interface DetailedTest {
  id: string;
  name: string;
  type: string;
  subject: string; // can be uuid or subject name depending on API format. We will handle both!
  topics: string[]; 
  sub_topics?: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: 'easy' | 'medium' | 'difficult';
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: 'draft' | 'live' | null;
  questions: string[]; // array of question UUIDs
  created_at?: string;
}

// API Functions
export const api = {
  // Authentication
  login: async (userId: string, password: string) => {
    const response = await apiClient.post('/auth/login', { userId, password });
    console.log({ response })
    return response.data;
  },

  // Subjects
  getSubjects: async () => {
    const response = await apiClient.get<{ success: boolean; data: Subject[] }>('/subjects');
    return response.data;
  },

  // Topics
  getTopicsBySubject: async (subjectId: string) => {
    const response = await apiClient.get<{ success: boolean; data: Topic[] }>(`/topics/subject/${subjectId}`);
    return response.data;
  },

  // Subtopics by single Topic
  getSubTopicsByTopic: async (topicId: string) => {
    const response = await apiClient.get<{ success: boolean; data: SubTopic[] }>(`/sub-topics/topic/${topicId}`);
    return response.data;
  },

  // Subtopics by multiple Topics (Bulk Fetch)
  getSubTopicsByMultiTopics: async (topicIds: string[]) => {
    const response = await apiClient.post<{ success: boolean; data: SubTopic[] }>('/sub-topics/multi-topics', { topicIds });
    return response.data;
  },

  // Tests CRUD
  getTests: async () => {
    const response = await apiClient.get<{ success: boolean; data: Test[] }>('/tests');
    return response.data;
  },

  getTestById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: DetailedTest }>(`/tests/${id}`);
    return response.data;
  },

  createTest: async (testData: Omit<Test, 'id' | 'created_at'>) => {
    const response = await apiClient.post<{ success: boolean; data: Test; message?: string }>('/tests', testData);
    return response.data;
  },

  updateTest: async (id: string, testData: Partial<Test>) => {
    const response = await apiClient.put<{ success: boolean; data: Test; message?: string }>(`/tests/${id}`, testData);
    return response.data;
  },

  // Note: Delete API is sometimes delete or custom. The description mentions "Edit, View, Delete buttons" in dashboard.
  // We will add deleteTest just in case, but handle it gracefully if the backend has/doesn't have delete.
  deleteTest: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`/tests/${id}`);
    return response.data;
  },

  // Questions Bulk API
  createQuestionsBulk: async (questions: Question[]) => {
    const response = await apiClient.post<{ success: boolean; data: Question[]; message?: string }>('/questions/bulk', { questions });
    return response.data;
  },

  // Fetch Questions Bulk API
  fetchQuestionsBulk: async (questionIds: string[]) => {
    const response = await apiClient.post<{ success: boolean; data: Question[] }>('/questions/fetchBulk', { question_ids: questionIds });
    return response.data;
  }
};
