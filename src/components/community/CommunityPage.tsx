import { Routes, Route, Navigate } from "react-router-dom";
import CommunityLayout from "./CommunityLayout";
import CommunityHome from "./CommunityHome";
import TopicSpaces from "./TopicSpaces";
import AskACoach from "./AskACoach";
import PromptLibrary from "./PromptLibrary";
import LiveEvents from "./LiveEvents";
import PrivateGroups from "./PrivateGroups";
import CommunityLeaderboard from "./CommunityLeaderboard";
import CommunityGuidelines from "./CommunityGuidelines";

interface CommunityPageProps {
  baseUrl: string;
  userRole: string;
}

const CommunityPage = ({ baseUrl, userRole }: CommunityPageProps) => {
  return (
    <CommunityLayout baseUrl={baseUrl}>
      <Routes>
        <Route index element={<CommunityHome baseUrl={baseUrl} userRole={userRole} />} />
        <Route path="topics" element={<TopicSpaces />} />
        <Route path="ask-a-coach" element={<AskACoach />} />
        <Route path="prompts" element={<PromptLibrary />} />
        <Route path="events" element={<LiveEvents />} />
        <Route path="groups" element={<PrivateGroups />} />
        <Route path="leaderboard" element={<CommunityLeaderboard />} />
        <Route path="guidelines" element={<CommunityGuidelines />} />
        <Route path="*" element={<Navigate to={baseUrl} replace />} />
      </Routes>
    </CommunityLayout>
  );
};

export default CommunityPage;
