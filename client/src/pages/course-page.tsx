import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Course, Quiz, Enrollment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReactPlayer from "react-player";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CoursePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/course/:id");
  const courseId = parseInt(params?.id || "0");

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
  });

  const { data: quizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/courses", courseId, "quizzes"],
  });

  const { data: enrollment } = useQuery<Enrollment>({
    queryKey: ["/api/enrollments", courseId],
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/enrollments", {
        courseId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", courseId],
      });
      toast({
        title: "Enrolled successfully",
        description: "You are now enrolled in this course",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      if (!enrollment) return;
      const res = await apiRequest(
        "PATCH",
        `/api/enrollments/${enrollment.id}/progress`,
        { progress }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", courseId],
      });
    },
  });

  if (courseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Course not found</p>
      </div>
    );
  }

  const handleProgress = ({ played }: { played: number }) => {
    const progress = Math.round(played * 100);
    if (enrollment && progress > enrollment.progress) {
      updateProgressMutation.mutate(progress);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        {!enrollment && (
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-lg font-semibold">
                  Price: ${course.price || "Free"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Enroll now to start learning
                </p>
              </div>
              <Button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enroll Now
              </Button>
            </CardContent>
          </Card>
        )}

        {enrollment && (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video">
                  <ReactPlayer
                    url={course.videoUrl}
                    width="100%"
                    height="100%"
                    controls
                    onProgress={handleProgress}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Progress</h2>
              <Progress value={enrollment.progress} />
              <p className="text-sm text-muted-foreground">
                {enrollment.progress}% completed
              </p>
            </div>

            {quizzes && quizzes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Course Quizzes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>
                          Test your knowledge of the course material
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full">Start Quiz</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
