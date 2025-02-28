import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogOut, Video, GraduationCap } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4">
          <header className="py-8">
            <h1 className="text-3xl font-bold">RMEduPath</h1>
            <p className="mt-2 text-muted-foreground">
              आपका शैक्षिक साथी
            </p>
          </header>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              अपनी यात्रा शुरू करें
            </h2>
            <Button 
              size="lg"
              onClick={() => setLocation("/auth")}
              className="mx-auto"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              लॉगिन / रजिस्टर
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">RMEduPath</h1>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user.role === "educator" && (
              <Button variant="outline" onClick={() => setLocation("/educator")}>
                Educator Dashboard
              </Button>
            )}
            {user.role === "student" && (
              <Button variant="outline" onClick={() => setLocation("/student")}>
                Student Dashboard
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Available Courses</h2>
          <p className="text-muted-foreground">
            Browse through our selection of courses
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setLocation(`/course/${course.id}`)}
                  >
                    View Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}