'use client';

const parseMarkdown = (text: string): string => {
  if (!text) return '';

  let html = text;

  // 리스트 처리
  const lines = html.split('\n');
  let inList = false;
  let processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^[\-\*] (.+)$/);

    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // 헤더 변환
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 강조 표시
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 구분선 처리
  html = html.replace(/^---$/gim, '<hr>');

  // 줄바꿈 처리
  html = html.split('\n\n').map(para => {
    para = para.trim();
    if (!para) return '';
    if (para.startsWith('<')) return para;
    return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
  }).filter(p => p).join('');

  return html;
};

interface AnalysisCardProps {
  analysis: string | null;
  userName?: string;
}

const AnalysisCard = ({ analysis, userName }: AnalysisCardProps) => {
  const displayTitle = userName 
    ? `${userName}'s Saju Analysis`
    : 'Saju Analysis';

  if (!analysis) {
    return (
      <div className="bg-background p-6 md:p-8 rounded-design">
        <h3 className="mb-4 md:mb-6 text-gloock-base font-gloock text-primary">{displayTitle}</h3>
        <div className="leading-[1.8] text-afacad-sm-light font-afacad text-primary">
          <p className="text-center">
            Reading your elemental flow
            <span className="searching-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-6 md:p-8 rounded-design">
      <h3 className="mb-4 md:mb-6 text-gloock-base font-gloock text-primary">{displayTitle}</h3>
      <div
        className="leading-[1.8] text-afacad-sm-light font-afacad text-primary [&_h2]:my-3 md:[&_h2]:my-4 [&_h2]:text-gloock-base [&_h2]:font-gloock [&_h2]:text-primary [&_h3]:my-3 md:[&_h3]:my-4 [&_h3]:text-gloock-sm [&_h3]:font-gloock [&_h3]:text-primary [&_p]:my-2 [&_p]:text-primary [&_p]:font-afacad [&_p]:text-afacad-sm-light [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:my-1 [&_li]:text-primary [&_li]:font-afacad [&_li]:text-afacad-sm-light [&_strong]:text-primary [&_strong]:font-bold [&_hr]:my-6 [&_hr]:border-primary/20"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(analysis) }}
      />
    </div>
  );
};

export default AnalysisCard;

