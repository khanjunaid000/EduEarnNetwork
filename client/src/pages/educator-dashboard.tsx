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
import { 
  Loader2, 
  Video, 
  Upload, 
  Book,
  Users,
  IndianRupee,
  LineChart,
  GraduationCap,
  Clock,
  BarChart
} from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";

export default function EducatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const totalStudents = 150; // This will come from backend
  const totalEarnings = 25000; // This will come from backend
  const avgCompletionRate = 75; // This will come from backend
  const activeStudents = 120; // This will come from backend

  const form = useForm({
    resolver: zodResolver(
      insertCourseSchema.extend({
        price: insertCourseSchema.shape.price,
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
        title: "फाइल अपलोड हो गई है",
        description: `${file.name} सफलतापूर्वक अपलोड हो गई है`,
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
        title: "कोर्स बन गया है",
        description: "आपका कोर्स सफलतापूर्वक बन गया है",
      });
    } catch (error: any) {
      toast({
        title: "एरर",
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
          <h1 className="text-3xl font-bold mb-2">एजुकेटर डैशबोर्ड</h1>
          <p className="text-muted-foreground">
            अपने कोर्सेज को मैनेज करें
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                कुल स्टूडेंट्स
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {activeStudents} एक्टिव स्टूडेंट्स
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                कुल कमाई
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings}</div>
              <p className="text-xs text-muted-foreground">
                पिछले महीने से +15%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                कंप्लीशन रेट
              </CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCompletionRate}%</div>
              <Progress value={avgCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">कुल कोर्सेज</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myCourses?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                पब्लिश्ड कोर्सेज
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Creation and Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>नया कोर्स बनाएं</CardTitle>
              <CardDescription>
                कोर्स की जानकारी और कंटेंट अपलोड करें
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
                        <FormLabel>कोर्स का टाइटल</FormLabel>
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
                        <FormLabel>विवरण</FormLabel>
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
                        <FormLabel>कोर्स विडियो</FormLabel>
                        <FormControl>
                          <div
                            {...getVideoProps()}
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <input {...getVideoInputProps()} />
                            <Video className="mx-auto h-8 w-8 mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              विडियो को यहाँ ड्रैग करें या सेलेक्ट करें
                            </p>
                            {field.value && (
                              <p className="mt-2 text-sm text-green-600">
                                विडियो अपलोड हो गई है
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
                        <FormLabel>स्टडी मैटेरियल</FormLabel>
                        <FormControl>
                          <div
                            {...getMaterialProps()}
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <input {...getMaterialInputProps()} />
                            <Book className="mx-auto h-8 w-8 mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              पीडीएफ या वर्ड डॉक्यूमेंट अपलोड करें
                            </p>
                            {field.value && (
                              <p className="mt-2 text-sm text-green-600">
                                मैटेरियल अपलोड हो गया है
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
                        <FormLabel>कीमत (₹)</FormLabel>
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
                    कोर्स बनाएं
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">मेरे कोर्सेज</h2>
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            कीमत: ₹{course.price}
                          </p>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">150 स्टूडेंट्स</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>कंप्लीशन रेट</span>
                            <span>75%</span>
                          </div>
                          <Progress value={75} />
                        </div>
                        <Button
                          onClick={() => setLocation(`/course/${course.id}`)}
                          variant="outline"
                          className="w-full"
                        >
                          कोर्स मैनेज करें
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