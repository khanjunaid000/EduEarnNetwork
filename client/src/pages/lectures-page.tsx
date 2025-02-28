import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function LecturesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // This would come from backend in a real app
  const todaysLectures = [
    {
      id: 1,
      title: "डेटा स्ट्रक्चर्स का परिचय",
      duration: "45 mins",
      completed: false
    },
    {
      id: 2,
      title: "एरे और लिंक्ड लिस्ट",
      duration: "50 mins",
      completed: false
    }
  ];

  const startLecture = (id: number, title: string) => {
    toast({
      title: "लेक्चर शुरू",
      description: `${title} लेक्चर शुरू हो रहा है`,
    });
    setLocation(`/course/lecture/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/student")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">आज के लेक्चर्स</h1>
            <p className="text-muted-foreground">
              आज के लिए निर्धारित विडियो लेक्चर्स
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {todaysLectures.map((lecture) => (
            <Card key={lecture.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between p-6">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {lecture.title}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {lecture.duration}
                  </div>
                  <Button 
                    onClick={() => startLecture(lecture.id, lecture.title)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    {lecture.completed ? "दोहराएं" : "शुरू करें"}
                  </Button>
                </div>
              </CardHeader>
              {lecture.completed && (
                <CardContent>
                  <div className="text-sm text-green-600 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-600 rounded-full" />
                    पूरा हो गया
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}