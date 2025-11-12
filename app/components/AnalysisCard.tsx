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
}

const AnalysisCard = ({ analysis }: AnalysisCardProps) => {
  if (!analysis) {
    return (
      <div className="bg-primary text-white p-6 md:p-8 rounded-design">
        <h3 className="mb-4 md:mb-6 text-gloock-base font-gloock">Saju Analysis</h3>
        <div className="leading-[1.8] text-afacad-base font-afacad">
          <p className="text-center text-white/70">Calculating your Saju analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary text-white p-6 md:p-8 rounded-design">
      <h3 className="mb-4 md:mb-6 text-gloock-base font-gloock">Saju Analysis</h3>
      <div
        className="leading-[1.8] text-afacad-base font-afacad [&_h2]:my-3 md:[&_h2]:my-4 [&_h2]:text-gloock-base [&_h2]:font-gloock [&_h2]:text-white [&_h3]:my-3 md:[&_h3]:my-4 [&_h3]:text-gloock-sm [&_h3]:font-gloock [&_h3]:text-white [&_p]:my-2 [&_p]:text-white [&_p]:font-afacad [&_ul]:my-2 [&_ul]:pl-5 [&_li]:my-1 [&_li]:text-white [&_li]:font-afacad [&_strong]:text-white [&_strong]:font-bold"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(analysis) }}
      />
    </div>
  );
};

export default AnalysisCard;

