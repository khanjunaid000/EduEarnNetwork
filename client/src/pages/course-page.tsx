import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Course, Quiz, Enrollment, insertQuizSchema } from "@shared/schema";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from 'react';
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type QuizFormValues = {
  title: string;
  questions: string[];
  answers: string[];
};

const quizFormSchema = insertQuizSchema.extend({
  questions: z.array(z.string().min(1, "Question is required")),
  answers: z.array(z.string().min(1, "Answer is required"))
});

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

  const handleProgress = ({ played }: { played: number }) => {
    const progress = Math.round(played * 100);
    if (enrollment && progress > enrollment.progress) {
      updateProgressMutation.mutate(progress);
    }
  };

  const [questions, setQuestions] = useState(['']);

  const quizForm = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      questions: [""],
      answers: [""],
    },
  });

  const onQuizSubmit = async (data: QuizFormValues) => {
    try {
      await apiRequest("POST", "/api/quizzes", {
        ...data,
        courseId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "quizzes"] });
      toast({
        title: "Quiz created",
        description: "Your quiz has been created successfully",
      });
      quizForm.reset();
      setQuestions(['']);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

            {user?.role === "educator" && course.educatorId === user.id && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full mt-4">
                    Create New Quiz
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Create Quiz</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <Form {...quizForm}>
                      <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-4">
                        <FormField
                          control={quizForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quiz Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {questions.map((_, index) => (
                          <div key={index} className="space-y-2">
                            <FormField
                              control={quizForm.control}
                              name={`questions.${index}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Question {index + 1}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={quizForm.control}
                              name={`answers.${index}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Answer {index + 1}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setQuestions([...questions, '']);
                            quizForm.setValue(`questions.${questions.length}`, '');
                            quizForm.setValue(`answers.${questions.length}`, '');
                          }}
                        >
                          Add Question
                        </Button>
                        <Button type="submit" className="w-full">
                          Create Quiz
                        </Button>
                      </form>
                    </Form>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        )}
      </div>
    </div>
  );
}