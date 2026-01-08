import fs from 'fs';
import path from 'path';
import Win98App from '@/components/win98-simulation/Win98App';

export default async function Home() {
  const tutorialPath = path.join(process.cwd(), 'public', 'TUTORIAL.md');
  let tutorialContent = '';

  try {
    tutorialContent = fs.readFileSync(tutorialPath, 'utf8');
  } catch (err) {
    console.error('Failed to read tutorial file:', err);
    tutorialContent = '# Welcome to Kit\n\n(Tutorial content missing)';
  }

  return <Win98App initialTutorialContent={tutorialContent} />;
}
