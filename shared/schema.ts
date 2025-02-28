import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow()
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  educatorId: integer("educator_id").notNull(),
  price: doublePrecision("price").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  questions: text("questions").array().notNull(),
  answers: text("answers").array().notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
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
  price: true
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  courseId: true,
  title: true,
  questions: true,
  answers: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
