import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourcesPanel } from "./ResourcesPanel";
import { TestsPanel } from "./TestsPanel";
import { AssignmentsPanel } from "./AssignmentsPanel";
import { DoubtButton } from "./DoubtButton";
import { FileText, ClipboardList, Link2 } from "lucide-react";

interface ChapterActionsProps {
  chapterNodeId: string;
  chapterName: string;
  isAdmin: boolean;
}

export function ChapterActions({ chapterNodeId, chapterName, isAdmin }: ChapterActionsProps) {
  return (
    <div className="mt-2 ml-2 border-l-2 border-primary/10 pl-3">
      <Tabs defaultValue="resources" className="w-full">
        <div className="flex items-center gap-2">
          <TabsList className="h-7">
            <TabsTrigger value="resources" className="text-[10px] h-6 px-2">
              <FileText className="h-3 w-3 mr-1" />Resources
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-[10px] h-6 px-2">
              <ClipboardList className="h-3 w-3 mr-1" />Tests
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-[10px] h-6 px-2">
              <Link2 className="h-3 w-3 mr-1" />Assignments
            </TabsTrigger>
          </TabsList>
          <DoubtButton chapterNodeId={chapterNodeId} chapterName={chapterName} />
        </div>
        <TabsContent value="resources" className="mt-2">
          <ResourcesPanel chapterNodeId={chapterNodeId} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="tests" className="mt-2">
          <TestsPanel chapterNodeId={chapterNodeId} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="assignments" className="mt-2">
          <AssignmentsPanel chapterNodeId={chapterNodeId} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
