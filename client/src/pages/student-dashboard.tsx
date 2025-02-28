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
  Brain,
  Calendar,
  Clock,
  GraduationCap,
  Users,
  Trophy,
  TrendingUp,
  Target,
  Flame,
  Loader2 // Added import
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
  const averageQuizScore =
    quizAttempts?.reduce((acc, curr) => acc + curr.score, 0) || 0;

  const studyStreak = 5; // This will come from backend
  const todaysGoal = 2; // This will come from backend
  const completedToday = 1; // This will come from backend

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">स्टूडेंट डैशबोर्ड</h1>
          <p className="text-muted-foreground">अपनी पढ़ाई को ट्रैक करें</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                एनरोल्ड कोर्सेज
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
                स्टडी स्ट्रीक
              </CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studyStreak} दिन</div>
              <p className="text-xs text-muted-foreground">
                लगातार पढ़ाई जारी रखें!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">आज का लक्ष्य</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedToday}/{todaysGoal}
              </div>
              <p className="text-xs text-muted-foreground">
                कोर्स यूनिट्स कंप्लीट
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">रेफरल कोड</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{user.referralCode}</div>
              <p className="text-xs text-muted-foreground">
                शेयर करें और कमाएं
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Study Plan and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI स्टडी प्लान
              </CardTitle>
              <CardDescription>
                आपके लिए परसनलाइज्ड स्टडी प्लान
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>अगला टॉपिक: डेटा स्ट्रक्चर्स</span>
                  </div>
                  <Button variant="outline" size="sm">
                    शुरू करें
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>आज का टारगेट: 2 विडियो लेक्चर्स</span>
                  </div>
                  <Button variant="outline" size="sm">
                    देखें
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                प्रोग्रेस रिपोर्ट
              </CardTitle>
              <CardDescription>
                अपनी पढ़ाई का प्रोग्रेस देखें
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>ओवरऑल प्रोग्रेस</span>
                    <span>
                      {completedCourses.length}/{enrollments?.length || 0} कोर्सेज
                    </span>
                  </div>
                  <Progress
                    value={
                      (completedCourses.length / (enrollments?.length || 1)) * 100
                    }
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>क्विज स्कोर</span>
                    <span>
                      {(averageQuizScore / (quizAttempts?.length || 1)).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={averageQuizScore / (quizAttempts?.length || 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                रीसेंट एक्टिविटी
              </CardTitle>
              <CardDescription>आपकी लेटेस्ट अचीवमेंट्स</CardDescription>
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
                      <span>क्विज स्कोर: {attempt.score}%</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">मेरे कोर्सेज</h2>
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
                          <span>प्रोग्रेस</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setLocation(`/course/${course.id}`)}
                      >
                        जारी रखें
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