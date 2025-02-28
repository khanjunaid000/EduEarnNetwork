import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function LecturesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">आज के लेक्चर्स</h1>
          <p className="text-muted-foreground">
            आज के लिए निर्धारित विडियो लेक्चर्स
          </p>
        </div>

        <div className="space-y-4">
          {todaysLectures.map((lecture) => (
            <Card key={lecture.id}>
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
                  <Button onClick={() => setLocation(`/course/lecture/${lecture.id}`)}>
                    {lecture.completed ? "दोहराएं" : "शुरू करें"}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
