import ReactMarkdown from "react-markdown";

interface TournamentSectionContentProps {
  content: string | null | undefined;
}

export function TournamentSectionContent({
  content,
}: TournamentSectionContentProps) {
  if (!content) return null;

  return (
    <div>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
