import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface TournamentSectionContentProps {
  content: string | null | undefined;
}

export function TournamentSectionContent({
  content,
}: TournamentSectionContentProps) {
  if (!content) return null;

  return (
    <div className="prose prose-sm prose-invert prose-headings:text-medieval-gold prose-a:text-medieval-gold prose-li:marker:text-medieval-gold-muted max-w-none">
      {/* rehype-raw lets legacy HTML content (imported from the old DB) render
          as markup, while new content authored in the Markdown editor keeps
          working as Markdown. */}
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </div>
  );
}
