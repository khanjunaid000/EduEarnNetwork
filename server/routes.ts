import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Setup file uploads
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage_config = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage: storage_config });

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Middleware to check if user is an educator
  const requireEducator = (req: any, res: any, next: any) => {
    if (req.user.role !== "educator" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only educators can access this resource" });
    }
    next();
  };

  // Middleware to check if user is an admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can access this resource" });
    }
    next();
  };

  // User Profile routes
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.user.id);
    res.json(user);
  });

  app.patch("/api/user/profile", requireAuth, upload.single("profileImage"), async (req, res) => {
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateData = {
      ...req.body,
      ...(profileImage && { profileImage }),
    };

    const updatedUser = await storage.updateUser(req.user.id, updateData);
    res.json(updatedUser);
  });

  // Educator Verification
  app.post("/api/educator/verify", requireAuth, requireEducator, async (req, res) => {
    // In a real app, you would handle document verification
    // For now, we'll just update the verification status
    const updatedUser = await storage.updateUser(req.user.id, { 
      isVerified: true 
    });
    res.json(updatedUser);
  });

  // Course routes
  app.post("/api/courses", requireAuth, requireEducator, upload.single("thumbnail"), async (req, res) => {
    const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const courseData = {
      ...req.body,
      ...(thumbnailUrl && { thumbnailUrl }),
      educatorId: req.user.id,
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined
    };

    const course = await storage.createCourse(courseData);
    res.status(201).json(course);
  });

  app.get("/api/courses", requireAuth, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/educator/courses", requireAuth, requireEducator, async (req, res) => {
    const courses = await storage.getEducatorCourses(req.user.id);
    res.json(courses);
  });

  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  });

  app.patch("/api/courses/:id", requireAuth, requireEducator, upload.single("thumbnail"), async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit your own courses" });
    }

    const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateData = {
      ...req.body,
      ...(thumbnailUrl && { thumbnailUrl }),
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined
    };

    const updatedCourse = await storage.updateCourse(parseInt(req.params.id), updateData);
    res.json(updatedCourse);
  });

  // Course Materials routes
  app.post("/api/course-materials", requireAuth, requireEducator, upload.single("file"), async (req, res) => {
    const course = await storage.getCourse(parseInt(req.body.courseId));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only add materials to your own courses" });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const materialData = {
      ...req.body,
      ...(fileUrl && { fileUrl })
    };

    const material = await storage.createCourseMaterial(materialData);
    res.status(201).json(material);
  });

  app.get("/api/courses/:courseId/materials", requireAuth, async (req, res) => {
    const materials = await storage.getCourseMaterials(parseInt(req.params.courseId));
    res.json(materials);
  });

  // Quiz routes
  app.post("/api/quizzes", requireAuth, requireEducator, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.body.courseId));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only add quizzes to your own courses" });
    }

    const quizData = {
      ...req.body,
      questions: req.body.questions ? JSON.parse(req.body.questions) : [],
      answers: req.body.answers ? JSON.parse(req.body.answers) : []
    };

    const quiz = await storage.createQuiz(quizData);
    res.status(201).json(quiz);
  });

  app.get("/api/courses/:courseId/quizzes", requireAuth, async (req, res) => {
    const quizzes = await storage.getCourseQuizzes(parseInt(req.params.courseId));
    res.json(quizzes);
  });

  app.get("/api/quizzes/:id", requireAuth, async (req, res) => {
    const quiz = await storage.getQuiz(parseInt(req.params.id));

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  });

  // Live Class routes
  app.post("/api/live-classes", requireAuth, requireEducator, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.body.courseId));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only schedule classes for your own courses" });
    }

    const liveClassData = {
      ...req.body,
      educatorId: req.user.id
    };

    const liveClass = await storage.createLiveClass(liveClassData);
    res.status(201).json(liveClass);
  });

  app.get("/api/courses/:courseId/live-classes", requireAuth, async (req, res) => {
    const liveClasses = await storage.getCourseLiveClasses(parseInt(req.params.courseId));
    res.json(liveClasses);
  });

  app.get("/api/educator/live-classes", requireAuth, requireEducator, async (req, res) => {
    const liveClasses = await storage.getEducatorLiveClasses(req.user.id);
    res.json(liveClasses);
  });

  // Assignment routes
  app.post("/api/assignments", requireAuth, requireEducator, upload.single("file"), async (req, res) => {
    const course = await storage.getCourse(parseInt(req.body.courseId));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only create assignments for your own courses" });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const assignmentData = {
      ...req.body,
      ...(fileUrl && { fileUrl })
    };

    const assignment = await storage.createAssignment(assignmentData);
    res.status(201).json(assignment);
  });

  app.get("/api/courses/:courseId/assignments", requireAuth, async (req, res) => {
    const assignments = await storage.getCourseAssignments(parseInt(req.params.courseId));
    res.json(assignments);
  });

  app.get("/api/assignments/:id/submissions", requireAuth, requireEducator, async (req, res) => {
    const assignment = await storage.getAssignment(parseInt(req.params.id));

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const course = await storage.getCourse(assignment.courseId);

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only view submissions for your own assignments" });
    }

    const submissions = await storage.getAssignmentSubmissions(parseInt(req.params.id));
    res.json(submissions);
  });

  app.post("/api/assignments/:id/submissions", requireAuth, upload.single("file"), async (req, res) => {
    const assignment = await storage.getAssignment(parseInt(req.params.id));

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (!fileUrl) {
      return res.status(400).json({ message: "File is required" });
    }

    const submissionData = {
      assignmentId: parseInt(req.params.id),
      userId: req.user.id,
      fileUrl,
      comments: req.body.comments
    };

    const submission = await storage.createAssignmentSubmission(submissionData);
    res.status(201).json(submission);
  });

  app.post("/api/submissions/:id/grade", requireAuth, requireEducator, async (req, res) => {
    const submission = await storage.getAssignmentSubmission(parseInt(req.params.id));

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await storage.getAssignment(submission.assignmentId);
    const course = await storage.getCourse(assignment.courseId);

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only grade submissions for your own assignments" });
    }

    const gradeData = {
      grade: req.body.grade,
      gradedAt: new Date()
    };

    const updatedSubmission = await storage.gradeAssignmentSubmission(parseInt(req.params.id), gradeData);
    res.json(updatedSubmission);
  });

  // Discussion routes
  app.post("/api/discussions", requireAuth, async (req, res) => {
    const discussionData = {
      ...req.body,
      userId: req.user.id
    };

    const discussion = await storage.createDiscussion(discussionData);
    res.status(201).json(discussion);
  });

  app.get("/api/courses/:courseId/discussions", requireAuth, async (req, res) => {
    const discussions = await storage.getCourseDiscussions(parseInt(req.params.courseId));
    res.json(discussions);
  });

  app.get("/api/educator/discussions", requireAuth, requireEducator, async (req, res) => {
    const courseIds = await storage.getEducatorCourseIds(req.user.id);
    const discussions = await storage.getDiscussionsByCourseIds(courseIds);
    res.json(discussions);
  });

  app.post("/api/discussions/:id/replies", requireAuth, async (req, res) => {
    const replyData = {
      discussionId: parseInt(req.params.id),
      userId: req.user.id,
      content: req.body.content
    };

    const reply = await storage.createDiscussionReply(replyData);
    res.status(201).json(reply);
  });

  app.get("/api/discussions/:id/replies", requireAuth, async (req, res) => {
    const replies = await storage.getDiscussionReplies(parseInt(req.params.id));
    res.json(replies);
  });

  app.patch("/api/discussions/:id/resolve", requireAuth, async (req, res) => {
    const discussion = await storage.getDiscussion(parseInt(req.params.id));

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const course = await storage.getCourse(discussion.courseId);

    if (discussion.userId !== req.user.id && course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only resolve your own discussions or discussions in your courses" });
    }

    const updatedDiscussion = await storage.updateDiscussion(parseInt(req.params.id), { isResolved: true });
    res.json(updatedDiscussion);
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
      progress: 0,
      lastAccessedAt: new Date()
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

  app.get("/api/courses/:courseId/enrollments", requireAuth, requireEducator, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.courseId));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only view enrollments for your own courses" });
    }

    const enrollments = await storage.getCourseEnrollments(parseInt(req.params.courseId));
    res.json(enrollments);
  });

  // Quiz attempt routes
  app.post("/api/quiz-attempts", requireAuth, async (req, res) => {
    const attemptData = {
      userId: req.user.id,
      quizId: req.body.quizId,
      score: req.body.score,
      answers: req.body.answers ? JSON.parse(req.body.answers) : undefined,
      timeSpent: req.body.timeSpent
    };

    const attempt = await storage.createQuizAttempt(attemptData);
    res.status(201).json(attempt);
  });

  app.get("/api/quiz-attempts", requireAuth, async (req, res) => {
    const attempts = await storage.getUserQuizAttempts(req.user.id);
    res.json(attempts);
  });

  app.get("/api/quizzes/:quizId/attempts", requireAuth, requireEducator, async (req, res) => {
    const quiz = await storage.getQuiz(parseInt(req.params.quizId));

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const course = await storage.getCourse(quiz.courseId);

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only view quiz attempts for your own quizzes" });
    }

    const attempts = await storage.getQuizAttempts(parseInt(req.params.quizId));
    res.json(attempts);
  });

  // Notification routes
  app.post("/api/notifications", requireAuth, requireEducator, async (req, res) => {
    // If sending to a specific user
    if (req.body.userId) {
      const notificationData = {
        userId: req.body.userId,
        title: req.body.title,
        message: req.body.message,
        type: req.body.type,
        relatedId: req.body.relatedId
      };

      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } 
    // If sending to all students in a course
    else if (req.body.courseId) {
      const course = await storage.getCourse(parseInt(req.body.courseId));

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (course.educatorId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only send notifications to your own courses" });
      }

      const enrollments = await storage.getCourseEnrollments(parseInt(req.body.courseId));
      const notificationPromises = enrollments.map(enrollment => 
        storage.createNotification({
          userId: enrollment.userId,
          title: req.body.title,
          message: req.body.message,
          type: req.body.type,
          relatedId: req.body.relatedId
        })
      );

      const notifications = await Promise.all(notificationPromises);
      res.status(201).json(notifications);
    } else {
      return res.status(400).json({ message: "Either userId or courseId is required" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await storage.getUserNotifications(req.user.id);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const notification = await storage.getNotification(parseInt(req.params.id));

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "You can only mark your own notifications as read" });
    }

    const updatedNotification = await storage.updateNotification(parseInt(req.params.id), { isRead: true });
    res.json(updatedNotification);
  });

  // Analytics routes
  app.get("/api/educator/analytics", requireAuth, requireEducator, async (req, res) => {
    const courses = await storage.getEducatorCourses(req.user.id);
    const courseIds = courses.map(course => course.id);

    const analyticsData = await storage.getAnalyticsByCourseIds(courseIds);
    const totalEarnings = await storage.getEducatorEarnings(req.user.id);

    res.json({
      coursesAnalytics: analyticsData,
      totalEarnings
    });
  });

  app.get("/api/courses/:courseId/analytics", requireAuth, requireEducator, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.courseId));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only view analytics for your own courses" });
    }

    const analytics = await storage.getCourseAnalytics(parseInt(req.params.courseId));
    res.json(analytics);
  });

  // Payouts routes
  app.post("/api/payouts/request", requireAuth, requireEducator, async (req, res) => {
    const user = await storage.getUserById(req.user.id);

    if (user.earnings < req.body.amount) {
      return res.status(400).json({ message: "Insufficient earnings for requested payout amount" });
    }

    const payoutData = {
      userId: req.user.id,
      amount: req.body.amount,
      status: "pending"
    };

    const payout = await storage.createPayout(payoutData);
    res.status(201).json(payout);
  });

  app.get("/api/payouts", requireAuth, requireEducator, async (req, res) => {
    const payouts = await storage.getUserPayouts(req.user.id);
    res.json(payouts);
  });

  // Admin routes for payouts
  app.get("/api/admin/payouts", requireAuth, requireAdmin, async (req, res) => {
    const payouts = await storage.getPendingPayouts();
    res.json(payouts);
  });

  app.patch("/api/admin/payouts/:id/process", requireAuth, requireAdmin, async (req, res) => {
    const payout = await storage.getPayout(parseInt(req.params.id));

    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    const updatedPayout = await storage.updatePayout(parseInt(req.params.id), {
      status: req.body.status,
      transactionId: req.body.transactionId,
      processedAt: new Date()
    });

    // Update user earnings if payout is processed
    if (req.body.status === "paid") {
      const user = await storage.getUserById(payout.userId);
      await storage.updateUser(payout.userId, {
        earnings: user.earnings - payout.amount
      });
    }

    res.json(updatedPayout);
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }, express.static(uploadsDir));

  const httpServer = createServer(app);
  return httpServer;
}