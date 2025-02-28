import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Course routes
  app.post("/api/courses", requireAuth, async (req, res) => {
    if (req.user.role !== "educator" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only educators can create courses" });
    }
    const course = await storage.createCourse({
      ...req.body,
      educatorId: req.user.id
    });
    res.status(201).json(course);
  });

  app.get("/api/courses", requireAuth, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  });

  // Quiz routes
  app.post("/api/quizzes", requireAuth, async (req, res) => {
    if (req.user.role !== "educator" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only educators can create quizzes" });
    }
    const quiz = await storage.createQuiz(req.body);
    res.status(201).json(quiz);
  });

  app.get("/api/courses/:courseId/quizzes", requireAuth, async (req, res) => {
    const quizzes = await storage.getCourseQuizzes(parseInt(req.params.courseId));
    res.json(quizzes);
  });

  // Enrollment routes
  app.post("/api/enrollments", requireAuth, async (req, res) => {
    const existingEnrollment = await storage.getEnrollment(
      req.user.id,
      req.body.courseId
    );
    if (existingEnrollment) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }
    const enrollment = await storage.createEnrollment({
      userId: req.user.id,
      courseId: req.body.courseId,
      completed: false,
      progress: 0
    });
    res.status(201).json(enrollment);
  });

  app.patch("/api/enrollments/:id/progress", requireAuth, async (req, res) => {
    const enrollment = await storage.updateEnrollmentProgress(
      parseInt(req.params.id),
      req.body.progress
    );
    res.json(enrollment);
  });

  // Quiz attempt routes
  app.post("/api/quiz-attempts", requireAuth, async (req, res) => {
    const attempt = await storage.createQuizAttempt({
      userId: req.user.id,
      quizId: req.body.quizId,
      score: req.body.score
    });
    res.status(201).json(attempt);
  });

  app.get("/api/quiz-attempts", requireAuth, async (req, res) => {
    const attempts = await storage.getUserQuizAttempts(req.user.id);
    res.json(attempts);
  });

  const httpServer = createServer(app);
  return httpServer;
}
