import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Upload, Book } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function EducatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertCourseSchema.extend({
        price: insertCourseSchema.shape.price.min(0),
        studyMaterial: insertCourseSchema.shape.videoUrl,
      })
    ),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      studyMaterial: "",
      price: 0,
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("video/")) {
        form.setValue("videoUrl", url);
      } else {
        form.setValue("studyMaterial", url);
      }
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    }
  }, [form, toast]);

  const { getRootProps: getVideoProps, getInputProps: getVideoInputProps } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    maxFiles: 1,
  });

  const { getRootProps: getMaterialProps, getInputProps: getMaterialInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [], "application/msword": [], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [] },
    maxFiles: 1,
  });

  const onSubmit = async (data: any) => {
    try {
      await apiRequest("POST", "/api/courses", {
        ...data,
        educatorId: user?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      form.reset();
      toast({
        title: "Course created",
        description: "Your course has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const myCourses = courses?.filter((course) => course.educatorId === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Educator Dashboard</h1>
          <p className="text-muted-foreground">
            Create and manage your courses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Course</CardTitle>
              <CardDescription>
                Fill in the details and upload course materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Video</FormLabel>
                        <FormControl>
                          <div
                            {...getVideoProps()}
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <input {...getVideoInputProps()} />
                            <Video className="mx-auto h-8 w-8 mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drag and drop your video here, or click to select
                            </p>
                            {field.value && (
                              <p className="mt-2 text-sm text-green-600">
                                Video uploaded successfully
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studyMaterial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Material</FormLabel>
                        <FormControl>
                          <div
                            {...getMaterialProps()}
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <input {...getMaterialInputProps()} />
                            <Book className="mx-auto h-8 w-8 mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Upload PDF or Word documents
                            </p>
                            {field.value && (
                              <p className="mt-2 text-sm text-green-600">
                                Material uploaded successfully
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Create Course
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">My Courses</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {myCourses?.map((course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        {course.title}
                      </CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Price: ${course.price}
                        </p>
                        <Button
                          onClick={() => setLocation(`/course/${course.id}`)}
                          variant="outline"
                          className="w-full"
                        >
                          Manage Course
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}