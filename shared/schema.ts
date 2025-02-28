import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "educator", "admin"] }).notNull().default("student"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  earnings: doublePrecision("earnings").notNull().default(0),
  profileImage: text("profile_image"),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false),
  bankDetails: jsonb("bank_details"),
  createdAt: timestamp("created_at").defaultNow()
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  educatorId: integer("educator_id").notNull(),
  price: doublePrecision("price").notNull().default(0),
  thumbnailUrl: text("thumbnail_url"),
  isSubscriptionBased: boolean("is_subscription_based").default(false),
  subscriptionPrice: doublePrecision("subscription_price").default(0),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).default("beginner"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow()
});

export const courseMaterials = pgTable("course_materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  type: text("type", { enum: ["video", "pdf", "assignment"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions").array().notNull(),
  answers: text("answers").array().notNull(),
  type: text("type", { enum: ["mcq", "subjective", "mixed"] }).default("mcq"),
  timeLimit: integer("time_limit"), // in minutes
  isLive: boolean("is_live").default(false),
  passingScore: integer("passing_score"),
  createdAt: timestamp("created_at").defaultNow()
});

export const liveClasses = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  educatorId: integer("educator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  meetingUrl: text("meeting_url").notNull(),
  meetingPlatform: text("meeting_platform", { enum: ["zoom", "google_meet", "other"] }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow()
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  answers: jsonb("answers"),
  timeSpent: integer("time_spent"), // in seconds
  createdAt: timestamp("created_at").defaultNow()
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  totalPoints: integer("total_points").default(100),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow()
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  userId: integer("user_id").notNull(),
  fileUrl: text("file_url"),
  comments: text("comments"),
  grade: integer("grade"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at")
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const discussionReplies = pgTable("discussion_replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["course", "assignment", "live", "quiz", "general"] }).notNull(),
  relatedId: integer("related_id"), // ID of the related record
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  educatorId: integer("educator_id").notNull(),
  totalEnrollments: integer("total_enrollments").default(0),
  completionRate: doublePrecision("completion_rate").default(0),
  averageRating: doublePrecision("average_rating").default(0),
  totalRevenue: doublePrecision("total_revenue").default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status", { enum: ["pending", "paid", "failed"] }).default("pending"),
  transactionId: text("transaction_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  videoUrl: true,
  educatorId: true,
  price: true,
  thumbnailUrl: true,
  isSubscriptionBased: true,
  subscriptionPrice: true,
  level: true,
  tags: true
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  courseId: true,
  title: true,
  description: true,
  questions: true,
  answers: true,
  type: true,
  timeLimit: true,
  isLive: true,
  passingScore: true
});

export const insertLiveClassSchema = createInsertSchema(liveClasses).pick({
  courseId: true,
  educatorId: true,
  title: true,
  description: true,
  meetingUrl: true,
  meetingPlatform: true,
  scheduledAt: true,
  duration: true
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  courseId: true,
  title: true,
  description: true,
  dueDate: true,
  totalPoints: true,
  fileUrl: true
});

export const insertDiscussionSchema = createInsertSchema(discussions).pick({
  courseId: true,
  userId: true,
  title: true,
  content: true
});

export const insertCourseMaterialSchema = createInsertSchema(courseMaterials).pick({
  courseId: true,
  type: true,
  title: true,
  description: true,
  fileUrl: true,
  orderIndex: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type LiveClass = typeof liveClasses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
