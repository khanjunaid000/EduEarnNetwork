import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Enrollment, Course, QuizAttempt } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Award,
  BookOpen,
  GraduationCap,
  Loader2,
  Users,
  Trophy,
  TrendingUp,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<
    Enrollment[]
  >({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: quizAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
  });

  if (!user) return null;

  const completedCourses = enrollments?.filter((e) => e.completed) || [];
  const inProgressCourses = enrollments?.filter((e) => !e.completed) || [];
  const averageQuizScore = quizAttempts?.reduce((acc, curr) => acc + curr.score, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your learning progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Enrolled Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enrollments?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Quizzes
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizAttempts?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg. Score: {(averageQuizScore / (quizAttempts?.length || 1)).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${user.earnings}</div>
              <p className="text-xs text-muted-foreground">
                From referrals & rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{user.referralCode}</div>
              <p className="text-xs text-muted-foreground">Share to earn</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Learning Progress
              </CardTitle>
              <CardDescription>
                Track your course completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>
                      {completedCourses.length}/{enrollments?.length || 0} Courses
                    </span>
                  </div>
                  <Progress
                    value={
                      (completedCourses.length / (enrollments?.length || 1)) * 100
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizAttempts?.slice(0, 3).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>Quiz Score: {attempt.score}%</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">My Courses</h2>
          {enrollmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments?.map((enrollment) => {
                const course = courses?.find((c) => c.id === enrollment.courseId);
                if (!course) return null;

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setLocation(`/course/${course.id}`)}
                      >
                        Continue Learning
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}