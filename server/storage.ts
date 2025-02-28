import { users, courses, quizzes, enrollments, quizAttempts } from "@shared/schema";
import type { User, InsertUser, Course, Quiz, Enrollment, QuizAttempt } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  createCourse(course: Omit<Course, "id" | "createdAt">): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  getEducatorCourses(educatorId: number): Promise<Course[]>;
  
  // Quiz operations
  createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getCourseQuizzes(courseId: number): Promise<Quiz[]>;
  
  // Enrollment operations
  createEnrollment(enrollment: Omit<Enrollment, "id" | "createdAt">): Promise<Enrollment>;
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  updateEnrollmentProgress(id: number, progress: number): Promise<Enrollment>;
  
  // Quiz attempt operations
  createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "createdAt">): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: number): Promise<QuizAttempt[]>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private quizzes: Map<number, Quiz>;
  private enrollments: Map<number, Enrollment>;
  private quizAttempts: Map<number, QuizAttempt>;
  sessionStore: session.SessionStore;
  private currentIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.quizzes = new Map();
    this.enrollments = new Map();
    this.quizAttempts = new Map();
    this.currentIds = {
      users: 1,
      courses: 1,
      quizzes: 1,
      enrollments: 1,
      quizAttempts: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const referralCode = `REF${id}${Math.random().toString(36).substring(2, 7)}`;
    const user: User = {
      ...insertUser,
      id,
      referralCode,
      referredBy: null,
      earnings: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createCourse(course: Omit<Course, "id" | "createdAt">): Promise<Course> {
    const id = this.currentIds.courses++;
    const newCourse: Course = { ...course, id, createdAt: new Date() };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getEducatorCourses(educatorId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.educatorId === educatorId
    );
  }

  async createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const id = this.currentIds.quizzes++;
    const newQuiz: Quiz = { ...quiz, id, createdAt: new Date() };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getCourseQuizzes(courseId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.courseId === courseId
    );
  }

  async createEnrollment(enrollment: Omit<Enrollment, "id" | "createdAt">): Promise<Enrollment> {
    const id = this.currentIds.enrollments++;
    const newEnrollment: Enrollment = { ...enrollment, id, createdAt: new Date() };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      (enrollment) => enrollment.userId === userId && enrollment.courseId === courseId
    );
  }

  async updateEnrollmentProgress(id: number, progress: number): Promise<Enrollment> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) throw new Error("Enrollment not found");
    
    const updatedEnrollment: Enrollment = {
      ...enrollment,
      progress,
      completed: progress === 100
    };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async createQuizAttempt(attempt: Omit<QuizAttempt, "id" | "createdAt">): Promise<QuizAttempt> {
    const id = this.currentIds.quizAttempts++;
    const newAttempt: QuizAttempt = { ...attempt, id, createdAt: new Date() };
    this.quizAttempts.set(id, newAttempt);
    return newAttempt;
  }

  async getUserQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(
      (attempt) => attempt.userId === userId
    );
  }
}

export const storage = new MemStorage();
