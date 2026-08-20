import { useState } from "react";
import type { View } from "@/types";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import MilestoneReview from "@/pages/MilestoneReview";
import ConfirmApproval from "@/pages/ConfirmApproval";
import MilestoneApproved from "@/pages/MilestoneApproved";
import RequestChanges from "@/pages/RequestChanges";
import RaiseDispute from "@/pages/RaiseDispute";
import Activity from "@/pages/Activity";

export default function App() {
  const [view, setView] = useState<View>("overview");

  const navigate = (next: View) => {
    setView(next);
    // Scroll content area to top on navigation
    const main = document.getElementById("main-content");
    if (main) main.scrollTop = 0;
  };

  return (
    <Layout currentView={view} navigate={navigate}>
      {view === "overview" && <Overview navigate={navigate} />}
      {view === "projects" && <Projects navigate={navigate} />}
      {view === "project-details" && <ProjectDetails navigate={navigate} />}
      {view === "milestone-review" && <MilestoneReview navigate={navigate} />}
      {view === "confirm-approval" && <ConfirmApproval navigate={navigate} />}
      {view === "milestone-approved" && <MilestoneApproved navigate={navigate} />}
      {view === "request-changes" && <RequestChanges navigate={navigate} />}
      {view === "request-changes-result" && <RequestChanges navigate={navigate} />}
      {view === "raise-dispute" && <RaiseDispute navigate={navigate} />}
      {view === "raise-dispute-result" && <RaiseDispute navigate={navigate} />}
      {view === "activity" && <Activity navigate={navigate} />}
    </Layout>
  );
}
